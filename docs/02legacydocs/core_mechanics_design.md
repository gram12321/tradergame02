# Core Mechanics Design Documentation

## Overview

Trader Game is a multiplayer economic simulation where players manage production facilities, trade resources, and build supply chains across multiple cities. The game progresses in real-time (hourly) or can be manually advanced by administrators.

## Core Game Loop

### Time Progression

The game operates on a **tick-based system** where:

- **Automatic Progression**: Game advances every hour in real-time
- **Manual Advancement**: Administrators can manually advance the game tick via an admin button (hidden from regular players)
- **Tick Processing**: On each game tick, all facilities across all players process simultaneously:
  - Production facilities consume inputs and produce outputs
  - Retail facilities process sales transactions
  - All economic activities are synchronized across the server

### Tick Processing Order

1. **Production Phase**: All production facilities process their recipes
2. **Sales Phase**: All retail facilities process customer purchases
3. **Economic Updates**: City wealth, population, and market conditions update
4. **Financial Reconciliation**: All transactions are recorded

## City System

Cities are the fundamental geographic units of the game world. Each city has unique economic characteristics that affect gameplay.

### City Attributes

- **Wealth Level**: Determines the economic prosperity of the city
  - Affects worker wages (higher wealth = higher wages)
  - Influences purchase power of residents
  - Impacts quality expectations for products
  
- **Population**: Number of residents in the city
  - Determines market size and demand volume
  - Affects available worker pool
  - Influences overall economic activity

- **Worker Characteristics**:
  - **Wage Rates**: Calculated based on city wealth (1-3x base wage multiplier)
  - **Skill Levels**: Higher wealth cities attract more skilled workers
  - **Availability**: Population determines worker pool size

- **Market Characteristics**:
  - **Purchase Power**: Higher wealth = higher spending capacity
  - **Quality Demand**: Wealthier cities demand higher quality products
  - **Price Sensitivity**: Varies by city wealth level



## Facility System

Facilities are the core production and storage units of the game. **Players do not have personal inventories** - all resources are stored in facility inventories.

### Facility Types

1. **Production Facilities**: Transform resources using recipes
   - Examples: Mill (grain → flour), Farm (seeds → grain)
   - Have input and output inventories
   - Process recipes automatically on each game tick

2. **Warehouse Facilities**: Storage-only facilities
   - No production capabilities
   - Used to store excess inventory
   - Can transfer resources between facilities
   - Essential for supply chain management

3. **Retail Facilities (Shops)**: Sell products to customers
   - Process sales on each game tick
   - Have inventory for products to sell
   - Generate revenue for players
   - Market share competition between players

### Facility Properties

- **Inventory**: Each facility maintains its own inventory
  - inventory: Resources waiting to be processed, resources from production output, or resources for selling
  - Storage capacity: Maximum inventory limits

- **Effectivity**: Production efficiency multiplier (0-100%)
  - Base effectivity: Facility-specific starting value
  - Office effectivity cap: Limited by controlling office (future feature)
  - Worker effectivity: Affected by worker count and skills (future feature)
  - Final effectivity = min(base, office_cap, worker_bonus)

- **Location**: Facilities are located in specific cities
  - City characteristics affect facility operations
  - Wage costs based on city wealth
  - Market access determined by city location

### Facility Recipe System

- **Recipe Assignment**: Each facility can accept one or more recipes
  - Facilities automatically select the first available recipe upon creation
  - Players can manually change recipes at any time
  - Recipe must have sufficient inputs in facility inventory

- **Recipe Execution**:
  - On each game tick, facility checks if current recipe can execute
  - Requires sufficient input resources in inventory
  - Produces output resources based on recipe and effectivity
  - Continues automatically until inputs are depleted

- **Recipe Sharing**: Recipes can be used by multiple facility types
  - Example: "Mill Grain" recipe can be used by different mill facilities
  - Recipe definitions are centralized and reusable
  - Facility-specific recipe restrictions possible

## Recipe System

Recipes define the transformation of resources in production facilities.

### Recipe Structure

- **Inputs**: Required resources and quantities
  - Example: "Mill Grain" requires 1x Grain
  - Multiple inputs supported (e.g., 2x Wood + 1x Iron)

- **Outputs**: Produced resources and quantities
  - Example: "Mill Grain" produces 1x Flour
  - Multiple outputs supported (e.g., 1x Product + 1x Byproduct)

- **Processing Time**: Number of game ticks required (default: 1 tick)

- **Effectivity Impact**: How facility effectivity affects production
  -  Effectivity affects processing speed

### Recipe Management

- **Recipe Registry**: Centralized map of all available recipes
  - Key: Recipe ID or name
  - Value: Recipe definition with inputs, outputs, processing time

- **Facility-Recipe Mapping**: 
  - Each facility type has a list of compatible recipes
  - Facilities can be created with recipe restrictions
  - Recipe availability checked before assignment

## Office System (Future Feature - Phase 2)

Offices are administrative centers that control facilities within a city.

### Office Mechanics (Not in Initial Implementation)

- **One Office Per City Per Player**: Each player must have one office per city he operates in 
- **Facility Control**: Office controls all player facilities in that city
- **Effectivity Capping**: Office effectivity limits all facility effectivities
  - Example: Office at 50% effectivity → All facilities in city capped at 50%
  - Base facility effectivity still matters (can't exceed office cap) base facility effectivity is multiplyed by office effectivity. IE a 80% eff productionfacility with a 50% office gets 80*0.5 = 40% effectivity
  - Formula: 


## Inventory System

### Facility-Based Inventory

- **No Player Inventory**: Players cannot directly hold resources
- **Facility Storage**: All resources exist in facility inventories
- **Transfer System**: Resources can be moved between facilities by creating contracts (Contracts are orders that is processed each gametick. User may create contracts between his own facilities. ) between your own facilities. 

### Inventory Management

- **Capacity Limits**: Each facility has maximum storage capacity
- **Resource Tracking**: Each resource type tracked separately
- **Cost Tracking**: Source cost tracking for profitability analysis
  - Tracks acquisition cost (purchase, production, transfer)
  - Weighted average for mixed inventory
  - Used for profit calculations

## Production System

### Automatic Production

- **Tick-Based Processing**: Production occurs on each game tick
- **Recipe Execution**: Facilities automatically process their assigned recipe
- **Input Consumption**: Required inputs consumed from facility inventory
- **Output Generation**: Produced outputs added to facility inventory
- **Continuous Operation**: Production continues until inputs depleted

### Production Calculation

```
effective_capacity = base_capacity × facility_effectivity
inputs_consumed = recipe_inputs × min(1, available_inputs / required_inputs)
outputs_produced = recipe_outputs × effective_capacity × inputs_consumed
```

### Production Factors (Initial vs. Future)

**Initial Implementation: Simple effectivity value**
- Single effectivity multiplier per facility
- Direct impact on output quantity

**Future Enhancements**:
- Worker count and skills
- Office effectivity capping
- Facility upgrades
- Technology research
- City bonuses

## Sales System (Overview - Detailed Design Later)

### Retail Facility Sales

- **Automatic Sales**: Retail facilities process sales on each game tick
- **Market Competition**: Multiple players compete for market share
- **Customer Behavior**: Based on city wealth, population, and quality preferences
- **Revenue Generation**: Sales generate income for players

### Sales Mechanics (To Be Detailed)

- Market share calculation
- Customer purchase decisions
- Price sensitivity
- Quality preferences
- Inventory requirements

## Multiplayer Architecture

### Synchronized Game State

- **Server Authority**: Game state managed on server
- **Real-Time Updates**: All players see synchronized game state
- **Tick Synchronization**: All facilities process simultaneously
- **Conflict Resolution**: Server resolves any timing conflicts

### Player Isolation

- **Company Scoping**: All data scoped by company_id
- **Independent Operations**: Players operate independently
- **Market Competition**: Players compete in shared markets
- **Resource Trading**: Direct trading between players (future feature)

## Implementation Phases

### Phase 1: Core Mechanics (Current Focus)

- ✅ City system with wealth and population
- ✅ Facility system with inventory
- ✅ Recipe system with input/output
- ✅ Production system with effectivity
- ✅ Warehouse facilities
- ✅ Game tick system
- ✅ Basic type definitions

### Phase 2: Office System

- Office creation and management
- Effectivity capping system
- City-wide facility control
- Administrative interfaces

### Phase 3: Advanced Features

- Worker system with skills
- Facility upgrades
- Technology research
- Transportation between cities
- Player-to-player trading
- Contracts and agreements

## Data Flow

### Game Tick Flow

```
1. Admin/System triggers game tick
   ↓
2. Server processes all facilities:
   - Production facilities: Input → Output
   - Retail facilities: Process sales
   ↓
3. Database updates:
   - Facility inventories
   - Company finances
   - Transaction records
   ↓
4. Real-time subscriptions notify clients
   ↓
5. UI updates automatically via reactive hooks
```

### Facility Operation Flow

```
1. Facility checks assigned recipe
   ↓
2. Validates input inventory sufficiency
   ↓
3. Calculates production based on effectivity
   ↓
4. Consumes inputs from inventory
   ↓
5. Produces outputs to inventory
   ↓
6. Records transaction
   ↓
7. Updates facility state
```

## Technical Considerations

### Performance

- Batch processing of facilities per tick
- Efficient database queries with proper indexing
- Real-time subscription optimization
- Client-side caching where appropriate

### Scalability

- Horizontal scaling for multiple game instances
- Database partitioning by company_id
- Efficient tick processing algorithms
- Rate limiting for manual tick advancement

### Data Consistency

- Transaction-based database operations
- Atomic facility processing
- Conflict resolution for concurrent updates
- Audit trail for all economic activities

