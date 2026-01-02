### Worker Wage System

- **City-Based Wage Calculation**:
  - Each city has an average wage based on its wealth level
  - Higher wealth cities have higher wages (1-3x base wage)
  - Base wage is 10 coins per worker per tick


- **Facility Wage Expenses**:
  - Worker wages are automatically deducted each tick
  - Total wage expense = number of hired workers × city wage
  - Each facility tracks wages paid last tick and total wages paid

- **Worker-to-Capacity Relationship**:
  - Effective capacity = base capacity × worker efficiency
  - UI shows both total capacity and current effective capacity


### Source Cost Tracking System

- **Cost Tracking by Resource**:
  - Each resource in a facility now tracks its acquisition cost

- **Cost Calculation for Different Acquisition Methods**:
  - **Market Purchases**: Direct purchase price becomes source cost
  - **Production**: Combines input resource costs + worker wages over production time
  - **Mixed Inventory**: When adding new resources to existing inventory, calculates proper weighted average

- **Production Costing Logic**:
  - Worker costs are allocated based on production cycle duration
  - Input costs based on the weighted average cost of consumed resources
  - Multi-output recipes distribute costs proportionally across all outputs

- **Cost Display and Profitability Analysis**:
  - Source cost displayed in inventory view for each resource

- **Technical Implementation**:
  - New `SourceCostData` interface tracking total cost, average cost, and timestamp

This system allows players to make more informed economic decisions, providing the true cost basis of their resources and supporting more strategic pricing, production, and purchasing decisions.


### Market Share Visualization & Analytics

- **Market Share Graph**:
  - Interactive pie chart visualization of each shop's market share by resource type
  - Color-coded representation with highlighted user-owned shops
  - Visual comparison of market dominance across cities and resources
  - Tooltips displaying detailed percentage information

- **City Market Analytics**:
  - Comprehensive city-wide market statistics for each resource
  - Total market volume (units sold) and total market value (coins)
  - Number of shops and companies present in each city
  - City average price and utilization metrics (sales per shop)
  - Visual dashboard displaying key market performance indicators

These visualization features help players quickly assess market conditions, identify opportunities, and make strategic decisions about pricing and inventory management.