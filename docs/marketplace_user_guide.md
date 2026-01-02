# Marketplace User Guide

## 🛒 What is the Marketplace?

The Marketplace is where players buy and sell resources from each other. Each facility can list items from its inventory for sale, and other players can purchase those items for their own facilities.

## 📍 Accessing the Marketplace

Click **"🛒 Marketplace"** in the main navigation bar at the top of the screen.

## 📊 Marketplace Dashboard

When you open the marketplace, you'll see four key statistics:

### Statistics Cards

1. **📦 Total Listings**
   - Number of active listings in the marketplace
   - Updates in real-time as listings are added/removed

2. **📈 Unique Resources**
   - How many different types of resources are available
   - Example: If there are 5 wheat listings and 3 flour listings, this shows "2"

3. **👥 Active Sellers**
   - Number of unique facilities currently selling
   - Helps gauge marketplace activity

4. **💰 Total Market Value**
   - Sum of all listing values (quantity × price)
   - Shows the total economy value in the marketplace

## 🔍 Finding What You Need

### Search Bar
- Type resource names to filter listings
- Example: Type "wheat" to see only wheat listings
- Search is case-insensitive and matches partial names

### Resource Filter
- Dropdown showing all available resource types
- Select "All Resources" to see everything
- Select a specific resource to filter to that type only

### Sort Options
Choose how to order the listings:
- **Newest First**: Recently listed items first (default)
- **Oldest First**: Oldest listings first
- **Price: Low to High**: Cheapest items first (great for buyers!)
- **Price: High to Low**: Most expensive items first
- **Quantity: Low to High**: Smallest quantities first
- **Quantity: High to Low**: Largest quantities first

## 📋 Reading the Listings Table

Each row in the table shows:

### Resource Column
- **Icon**: Visual representation of the resource (🌾, 🍞, etc.)
- **Name**: Resource name (Wheat, Flour, Bread, etc.)

### Quantity Column
- How many units are available
- This is the total amount you can purchase

### Price/Unit Column
- Cost per single unit of the resource
- Shown in currency format ($X.XX)

### Total Price Column
- Quantity × Price/Unit
- The total cost to buy the entire listing
- **Bold text** for emphasis

### Seller Column
- Shows who is selling the item
- **"Your Listing"** badge appears if you own this listing
- Other listings show facility ID (abbreviated)

### Listed Column
- When the listing was created
- Shows as:
  - "Today" - Listed today
  - "Yesterday" - Listed yesterday
  - "X days ago" - Listed X days ago

### Action Column
- **Buy Button**: Click to purchase (coming soon)
- **"Your Item" Badge**: Shown for your own listings (can't buy your own items)

## 🎯 Using the Marketplace

### As a Buyer

1. **Browse Listings**
   - Open the marketplace
   - Use search/filter to find what you need

2. **Compare Prices**
   - Sort by "Price: Low to High" to find best deals
   - Check quantity vs. total price

3. **Purchase** (Coming Soon)
   - Click "Buy" button on desired listing
   - Confirm purchase
   - Resources transfer to your facility
   - Money transfers to seller

### As a Seller

1. **Create Listings**
   - Go to any of your facilities
   - Open the "Inventory" tab
   - Set "For Sale" quantity for resources
   - Set "Sale Price" per unit
   - Click "Create Market Listings"

2. **Monitor Your Listings**
   - Open marketplace
   - Your listings show "Your Listing" badge
   - You cannot buy your own items

3. **Manage Listings** (Future Feature)
   - Edit prices
   - Adjust quantities
   - Cancel listings

## ✨ Special Features

### Real-Time Updates
- Marketplace updates automatically when:
  - New listings are created
  - Listings are purchased/cancelled
  - Prices or quantities change
- No need to refresh the page!

### Own Listing Protection
- Your listings are clearly marked
- Buy button is disabled for your items
- Prevents accidental self-purchasing

### Smart Empty States
- **No Listings**: "The marketplace is empty. Be the first to list resources!"
- **No Results**: "Try adjusting your filters or search query."

### Error Handling
- If data fails to load, you'll see an error message
- Click "Try Again" to retry loading

## 💡 Tips & Tricks

### For Buyers
1. **Sort by Price**: Find the best deals quickly
2. **Search First**: Use search to narrow down options
3. **Check Quantities**: Larger quantities might have better per-unit prices
4. **Monitor Regularly**: New listings appear in real-time

### For Sellers
1. **Competitive Pricing**: Check existing listings before setting prices
2. **List Multiple Resources**: Diversify your offerings
3. **Update Regularly**: Keep listings fresh and competitive
4. **Start Small**: Test the market with smaller quantities first

### General
1. **Use Filters Together**: Combine search + resource filter + sort for precise results
2. **Refresh Button**: Click refresh if you suspect data is stale
3. **Watch Statistics**: Market stats show overall activity and value

## 🔮 Coming Soon

Features planned for future releases:

### Purchase System
- Complete transaction processing
- Automatic resource transfer
- Money transfer between companies
- Transaction history

### Advanced Features
- **Bulk Purchase**: Buy partial quantities
- **Price History**: See historical pricing trends
- **Seller Ratings**: Rate your trading partners
- **Wishlist**: Save favorite resources or searches
- **Notifications**: Get alerts for specific resources
- **Location-Based**: See distance to seller facilities
- **Shipping Costs**: Distance-based pricing

### Listing Management
- Edit existing listings
- Cancel listings
- View your listing history
- See purchase statistics

## ❓ FAQ

**Q: Can I buy from my own listings?**
A: No, the system prevents self-purchasing. Your listings are marked with "Your Listing" badge.

**Q: How do I create a listing?**
A: Go to any facility → Inventory tab → Set quantity and price → Click "Create Market Listings"

**Q: Why can't I purchase items yet?**
A: Purchase functionality requires the transaction system, which is coming soon. Currently you can browse and create listings.

**Q: Do listings expire?**
A: Not currently. Listings remain active until purchased or cancelled.

**Q: Can I edit my listings?**
A: Not yet. This feature is planned for a future update. For now, you can cancel and create new listings.

**Q: How many listings can I create?**
A: There's no limit! List as many resources as you have in your facility inventories.

**Q: Are prices negotiable?**
A: No, prices are fixed when listings are created. Future updates may add negotiation features.

**Q: Can I see who's selling?**
A: Currently you see facility IDs. Future updates will show company names and seller profiles.

## 🐛 Troubleshooting

### Marketplace Won't Load
1. Check your internet connection
2. Click the "Refresh" button
3. Try navigating away and back
4. Check browser console for errors

### Listings Not Appearing
1. Verify you created listings (check facility inventory tab)
2. Check database for listing records
3. Ensure listings are marked as "active" status
4. Try refreshing the page

### Search Not Working
1. Check spelling of resource names
2. Try clearing search and using filter instead
3. Ensure you're searching for resources that exist

### Real-Time Updates Not Working
1. Check Supabase connection
2. Verify realtime is enabled in Supabase
3. Check browser console for subscription errors

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review `docs/market_system_implementation.md` for technical details
3. Check browser console for error messages
4. Report bugs with reproduction steps

---

**Happy Trading! 🛒💰**

The marketplace is your gateway to player-to-player commerce. Buy low, sell high, and build your trading empire!

