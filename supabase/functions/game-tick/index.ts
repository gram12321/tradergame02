import { createClient } from 'jsr:@supabase/supabase-js@2';

// Game constants
const DAYS_PER_MONTH = 24;
const MONTHS_PER_YEAR = 7;
const GAME_TIME_TABLE = 'game_time';
const GLOBAL_GAME_TIME_ID = 'global';

interface GameTime {
  tick: number;
  day: number;
  month: number;
  year: number;
  lastTickTime: string;
  nextTickTime: string;
}

/**
 * Get next hour boundary from current time
 */
function getNextHourBoundary(): Date {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  return now;
}

/**
 * Advance game time by one tick
 */
function advanceGameTime(currentTime: GameTime): GameTime {
  let { day, month, year, tick } = currentTime;
  
  tick += 1;
  day += 1;
  
  if (day > DAYS_PER_MONTH) {
    day = 1;
    month += 1;
  }
  
  if (month > MONTHS_PER_YEAR) {
    month = 1;
    year += 1;
  }
  
  return {
    tick,
    day,
    month,
    year,
    lastTickTime: new Date().toISOString(),
    nextTickTime: getNextHourBoundary().toISOString(),
  };
}

/**
 * Advance production for all active facilities (globally, all players)
 * Uses PostgreSQL function to increment progress, then handles completions
 */
async function advanceAllFacilitiesProduction(supabase: any): Promise<number> {
  try {
    // Step 1: Call PostgreSQL function to increment all facilities' progress
    const { data: incrementCount, error: rpcError } = await supabase.rpc('advance_all_production');
    
    if (rpcError) {
      console.error('Error calling advance_all_production:', rpcError);
      return 0;
    }

    console.log(`Incremented progress for ${incrementCount} facilities`);

    // Step 2: Fetch facilities that need completion processing (progress >= processingTicks)
    const { data: facilities, error: fetchError } = await supabase
      .from('facilities')
      .select(`
        id,
        active_recipe_id,
        progress_ticks,
        effectivity,
        inventory,
        is_producing
      `)
      .eq('type', 'production')
      .eq('is_producing', true);

    if (fetchError) {
      console.error('Error fetching facilities:', fetchError);
      return incrementCount ?? 0;
    }

    if (!facilities || facilities.length === 0) {
      return incrementCount ?? 0;
    }

    // Step 3: Fetch all recipes from database (single source of truth)
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*');

    if (recipesError || !recipes) {
      console.error('Error fetching recipes:', recipesError);
      return incrementCount ?? 0;
    }

    // Create recipe lookup map
    const recipeMap = new Map(recipes.map((r: any) => [r.id, r]));

    // Step 4: Process facilities that completed production
    let completedCount = 0;
    for (const facility of facilities) {
      const recipe = recipeMap.get(facility.active_recipe_id);
      if (!recipe) continue;

      // Check if this facility completed a cycle
      if (facility.progress_ticks >= recipe.processing_ticks) {
        const success = await completeProduction(facility, recipe, supabase);
        if (success) completedCount++;
      }
    }

    console.log(`Completed production for ${completedCount} facilities`);
    return incrementCount ?? 0;
  } catch (error) {
    console.error('Error in advanceAllFacilitiesProduction:', error);
    return 0;
  }
}

/**
 * Complete a production cycle for a facility
 * Handles production completion with overflow carry-over
 */
async function completeProduction(facility: any, recipe: any, supabase: any): Promise<boolean> {
  try {
    // Calculate overflow progress (supports fractional progress systems)
    const overflow = facility.progress_ticks - recipe.processing_ticks;

    // Apply effectivity to outputs
    const effectivityMultiplier = facility.effectivity / 100;
    const outputs = recipe.outputs.map((output: any) => ({
      resourceId: output.resourceId,
      quantity: Math.floor(output.quantity * effectivityMultiplier),
    }));

    // Add outputs to inventory (no input consumption - inputs were consumed at cycle start)
    const inventoryWithOutputs = addOutputsToInventory(facility.inventory, outputs);

    // Check if we can start next cycle (have inputs available)
    const canContinue = checkHasInputs(inventoryWithOutputs, recipe.inputs);

    let finalInventory = inventoryWithOutputs;
    let finalProgress = overflow;
    
    if (canContinue) {
      // Consume inputs for next cycle and carry over progress
      finalInventory = consumeInputsFromInventory(inventoryWithOutputs, recipe.inputs);
      // Progress starts at overflow (carry-over from previous cycle)
    } else {
      // No inputs for next cycle - stop production, keep overflow progress
      finalProgress = facility.progress_ticks;
    }

    // Update facility
    const { error } = await supabase
      .from('facilities')
      .update({
        inventory: finalInventory,
        is_producing: canContinue,
        progress_ticks: finalProgress,
      })
      .eq('id', facility.id);

    if (error) {
      console.error(`Error completing production for facility ${facility.id}:`, error);
    }

    return !error;
  } catch (error) {
    console.error('Error completing production:', error);
    return false;
  }
}

/**
 * Consume inputs from inventory (at production start/continuation)
 */
function consumeInputsFromInventory(
  inventory: any,
  inputs: Array<{ resourceId: string; quantity: number }>
): any {
  const items = [...(inventory?.items || [])];

  // Remove inputs from inventory
  for (const input of inputs) {
    const itemIndex = items.findIndex((item: any) => item.resourceId === input.resourceId);
    if (itemIndex >= 0) {
      items[itemIndex].quantity -= input.quantity;
      if (items[itemIndex].quantity <= 0) {
        items.splice(itemIndex, 1);
      }
    }
  }

  const currentUsage = items.reduce((sum: number, item: any) => sum + item.quantity, 0);

  return {
    items,
    capacity: inventory?.capacity || 1000,
    currentUsage,
  };
}

/**
 * Add outputs to inventory (at production completion)
 */
function addOutputsToInventory(
  inventory: any,
  outputs: Array<{ resourceId: string; quantity: number }>
): any {
  const items = [...(inventory?.items || [])];

  // Add outputs to inventory
  for (const output of outputs) {
    const itemIndex = items.findIndex((item: any) => item.resourceId === output.resourceId);
    if (itemIndex >= 0) {
      items[itemIndex].quantity += output.quantity;
    } else {
      items.push({
        resourceId: output.resourceId,
        quantity: output.quantity,
      });
    }
  }

  const currentUsage = items.reduce((sum: number, item: any) => sum + item.quantity, 0);

  return {
    items,
    capacity: inventory?.capacity || 1000,
    currentUsage,
  };
}

/**
 * Check if inventory has required inputs
 */
function checkHasInputs(
  inventory: any,
  inputs: Array<{ resourceId: string; quantity: number }>
): boolean {
  if (!inputs || inputs.length === 0) return true;

  const items = inventory?.items || [];
  for (const input of inputs) {
    const item = items.find((i: any) => i.resourceId === input.resourceId);
    if (!item || item.quantity < input.quantity) {
      return false;
    }
  }
  return true;
}

/**
 * Main Edge Function handler
 */
Deno.serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request body to check if this is a manual tick
    let isManualTick = false;
    try {
      const body = await req.json();
      isManualTick = body?.manual === true;
    } catch {
      // Not JSON or no body - treat as automatic cron tick
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current game time
    const { data: gameTimeData, error: fetchError } = await supabase
      .from(GAME_TIME_TABLE)
      .select('*')
      .eq('id', GLOBAL_GAME_TIME_ID)
      .single();

    if (fetchError || !gameTimeData) {
      return new Response(
        JSON.stringify({ error: 'Game time not initialized' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentTime: GameTime = {
      tick: gameTimeData.tick,
      day: gameTimeData.day,
      month: gameTimeData.month,
      year: gameTimeData.year,
      lastTickTime: gameTimeData.last_tick_time,
      nextTickTime: gameTimeData.next_tick_time,
    };

    // For manual ticks, skip time check
    if (!isManualTick) {
      // Check if it's time to advance (automatic cron tick)
      const now = new Date();
      const nextTick = new Date(currentTime.nextTickTime);

      if (now < nextTick) {
        return new Response(
          JSON.stringify({
            message: 'Not yet time to advance',
            currentTime,
            timeUntilNext: Math.floor((nextTick.getTime() - now.getTime()) / 1000),
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Advance game time
    const newTime = advanceGameTime(currentTime);

    // Save new time to database
    const { error: saveError } = await supabase
      .from(GAME_TIME_TABLE)
      .upsert({
        id: GLOBAL_GAME_TIME_ID,
        tick: newTime.tick,
        day: newTime.day,
        month: newTime.month,
        year: newTime.year,
        last_tick_time: newTime.lastTickTime,
        next_tick_time: isManualTick ? currentTime.nextTickTime : newTime.nextTickTime, // Preserve scheduled tick for manual
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (saveError) {
      console.error('Error saving game time:', saveError);
      return new Response(
        JSON.stringify({ error: 'Failed to save game time', details: saveError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Advance production for all facilities
    const facilitiesAdvanced = await advanceAllFacilitiesProduction(supabase);

    console.log(`Game tick processed${isManualTick ? ' (manual)' : ''}: Day ${newTime.day}, Month ${newTime.month}, Year ${newTime.year}`);
    console.log(`Advanced ${facilitiesAdvanced} facilities`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Game tick processed successfully${isManualTick ? ' (manual)' : ''}`,
        newTime,
        facilitiesAdvanced,
        manual: isManualTick,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in game-tick function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
