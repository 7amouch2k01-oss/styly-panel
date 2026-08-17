# Styly Admin Dashboard - Update Notes

## Project Context Update

**The Styly Admin Dashboard is now a fashion/clothing/shoes/accessories retail platform** for a mobile app that sells branded products. All features and pages must be redesigned to support this retail context.

---

## Design Reference Screenshots Analysis

### Screenshot 1: Gestion des Produits (Products Management)
**Key Design Elements:**
- Dark navy/charcoal background with high contrast white text
- Sidebar with "Admin Panel" branding and navigation items
- Active nav item has **coral/salmon red accent** with a left border highlight
- KPI cards with colorful icon badges
- "Nouveau Produit" button in **coral/salmon red** color
- Product table with image column
- Status badges in various colors

### Screenshot 2: Gestion des Posts (Posts Management)
**Key Design Elements:**
- Same dark theme and sidebar layout
- Active nav item has **coral/salmon red accent**
- KPI cards with colored icons
- "Nouveau Post" button in **coral/salmon red**
- Status dropdown with **golden/yellow border**
- Table with engagement metrics

### Screenshot 3: Gestion des Utilisateurs (Users Management)
**Key Design Elements:**
- Same dark theme and sidebar layout
- Active nav item has **coral/salmon red accent**
- KPI cards with colored icons
- "Nouvel Utilisateur" button in **coral/salmon red**
- User avatars with **coral/salmon red** background
- Role badges in green
- Status dropdowns with green borders

---

## Color Palette Specification

### Primary Accent Color: Coral/Salmon Red with Orange Animation
- **Current**: Blue (#3B82F6)
- **Target**: Coral/Salmon Red (#FF6B6B) animated to Orange (#FF8C42)
- **Animation**: Smooth 3-4 second loop, continuous gradient animation
- **Usage**: 
  - Active navigation items (left border + background)
  - Primary action buttons ("Nouveau..." buttons)
  - Icon badges in KPI cards
  - Brand avatars
  - Accent highlights

### Secondary Colors (Keep Consistent)
- **Blue**: #3B82F6 (for specific icons/badges)
- **Green**: #10B981 (for positive/active status)
- **Purple**: #A855F7 (for secondary icons)
- **Orange**: #F97316 (for warnings/secondary actions)
- **Yellow/Gold**: #FBBF24 (for draft/pending status)

---

## Theme Toggle Feature

### Light Theme Requirements
- Light background (#F5F5F5 or #FFFFFF)
- Dark text for readability
- Lighter card backgrounds
- Maintain the coral/orange gradient accent color
- Adjust shadows and borders for light mode

### Dark Theme (Current)
- Keep existing dark navy/charcoal theme
- Maintain current color scheme
- Coral/orange gradient accent

### Toggle Implementation
- Add theme toggle button in the header
- Persist theme selection to localStorage
- Smooth transition between themes
- Apply to all pages consistently

---

## New Sidebar Navigation Structure

### Current Navigation Items
1. Dashboard (Overview)
2. Users (Customer Management)
3. Devices → **CHANGE TO: Products** (Clothing, Shoes, Accessories)
4. Orders (Order Management)
5. Analytics (Sales Analytics)
6. **Brands** ← **NEW SECTION** (Insert before Settings)
7. Settings

---

## New Brands Management Page

### Purpose
Manage all fashion brands available in the mobile app. Brands are the core of the retail platform.

### Featured Brands (Tunisia + International)
**International Premium Brands:**
- Nike
- Adidas
- Zara
- H&M
- Gucci
- Louis Vuitton
- Prada
- Tommy Hilfiger
- Calvin Klein
- Lacoste

**Tunisian & Regional Brands:**
- Zen (Tunisian fashion brand)
- Exist (Tunisian brand)
- Carthage (Tunisian heritage brand)
- Bab Souika (Local artisan brand)
- Tataouine Crafts (Regional brand)
- Sfax Fashion (Regional brand)
- Tunis Couture (Local designer)
- Djerba Textiles (Regional specialty)

### Brands Page Features

#### KPI Cards
- **Total Brands**: Count of all brands in system
- **Active Brands**: Brands with active products
- **Inactive Brands**: Brands with no active products
- **Total Products**: Total items across all brands

#### Brand Management Table
Columns:
- **Logo/Image**: Brand logo thumbnail
- **Brand Name**: Official brand name
- **Category**: Type (Clothing, Shoes, Accessories, Mixed)
- **Country**: Origin country (Tunisia, France, USA, Italy, etc.)
- **Products Count**: Number of products under this brand
- **Status**: Active/Inactive
- **Actions**: Edit, Delete, View Products

#### Brand Details Dialog
- Brand name and logo
- Country of origin
- Description/About
- Website (if available)
- Product count
- Status toggle (Active/Inactive)
- Edit and Delete buttons

#### Add/Edit Brand Form
- Brand name (required)
- Logo upload
- Country selection dropdown
- Category selection (Clothing, Shoes, Accessories, Mixed)
- Description textarea
- Website URL (optional)
- Status toggle
- Save/Cancel buttons

---

## Updated Page Contexts for Fashion Retail

### Dashboard/Overview
**Current**: Generic dashboard metrics
**New**: Fashion retail metrics
- Total Products (across all brands)
- Total Orders (this month)
- Revenue (this month)
- Active Customers
- Recent Activity: New orders, new products, brand updates

### Products Page (formerly Devices)
**Changes**:
- Rename "Devices" to "Products"
- Add product categories: Clothing, Shoes, Accessories
- Add brand filter dropdown
- Add size/fit information
- Add color variants
- Product images (multiple per product)
- Price and discount fields
- Stock levels per size/color
- Product status (Active, Draft, Discontinued)

### Users Page
**Changes**:
- Rename to "Customers" (optional, keep as Users)
- Add customer purchase history
- Add total spent metric
- Add favorite brands/products
- Add customer segments (VIP, Regular, New)
- Keep role management for admin users

### Orders Page
**Changes**:
- Add order items breakdown (products ordered)
- Add shipping address
- Add payment method
- Add tracking number
- Add return/exchange status
- Add customer contact info

### Analytics Page
**Changes**:
- Sales by brand (top selling brands)
- Sales by category (Clothing vs Shoes vs Accessories)
- Top products
- Customer demographics
- Revenue trends
- Inventory levels by brand
- Return/exchange rates

### Settings Page
**Changes**:
- App configuration for fashion retail
- Shipping settings
- Return policy settings
- Size chart management
- Currency and pricing settings
- Notification preferences

### Brands Page (NEW)
**Features**:
- Brand listing with logos
- Brand management (add/edit/delete)
- Brand details and statistics
- Product count per brand
- Brand activation/deactivation
- Brand categorization

---

## Database Schema Updates

### New Tables Needed
1. **brands** table
   - id (primary key)
   - name (brand name)
   - logo_url (brand logo)
   - country (origin country)
   - category (Clothing, Shoes, Accessories, Mixed)
   - description (about brand)
   - website (optional URL)
   - status (active/inactive)
   - created_at
   - updated_at

2. **product_categories** table
   - id
   - name (Clothing, Shoes, Accessories)
   - description
   - icon_url

3. **products** table (update from devices)
   - id
   - name
   - brand_id (foreign key to brands)
   - category_id (foreign key to product_categories)
   - description
   - price
   - discount_percentage
   - images (JSON array or separate table)
   - colors (JSON array)
   - sizes (JSON array)
   - stock_quantity
   - status (active, draft, discontinued)
   - created_at
   - updated_at

### Updated Tables
- **devices** → Rename to **products** or create new products table
- **orders** → Add brand_id and category_id references
- **order_items** → Update to reference new products table

---

## Implementation Checklist

### Phase 1: Documentation & Planning
- [x] Document design changes
- [x] Document new Brands page requirements
- [x] Document database schema updates
- [x] Document page context changes
- [ ] Await user confirmation to proceed

### Phase 2: Color Scheme & Animation
- [ ] Update Tailwind CSS to use coral/salmon red (#FF6B6B)
- [ ] Create animated gradient from red to orange (#FF6B6B → #FF8C42)
- [ ] Apply new accent color to all UI elements
- [ ] Update `client/src/index.css` with new color variables
- [ ] Test color consistency across all pages

### Phase 3: Theme Toggle
- [ ] Add theme toggle button to header
- [ ] Create light theme color scheme
- [ ] Update ThemeProvider to support both themes
- [ ] Implement localStorage persistence
- [ ] Add smooth transition CSS
- [ ] Test theme switching on all pages

### Phase 4: Database Schema
- [ ] Create brands table
- [ ] Create product_categories table
- [ ] Update products table schema
- [ ] Create and apply migrations
- [ ] Seed database with Tunisian and international brands

### Phase 5: Brands Page
- [ ] Create Brands page component
- [ ] Build brand listing with logos
- [ ] Create brand detail dialog
- [ ] Create add/edit brand form
- [ ] Implement delete brand with confirmation
- [ ] Add brand KPI cards
- [ ] Create tRPC procedures for brand CRUD

### Phase 6: Update All Pages
- [ ] Rename Devices to Products
- [ ] Update Products page for fashion context
- [ ] Update Users page labels and features
- [ ] Update Orders page for fashion retail
- [ ] Update Analytics page for fashion metrics
- [ ] Update Settings page for retail configuration
- [ ] Update Dashboard/Overview for fashion metrics

### Phase 7: Testing & Polish
- [ ] Verify color consistency
- [ ] Test animations (60fps)
- [ ] Test theme toggle
- [ ] Test all CRUD operations
- [ ] Test responsive design
- [ ] Verify accessibility
- [ ] Final visual polish

---

## Notes
- The dashboard is now a **fashion/retail platform** for a mobile app selling branded clothing, shoes, and accessories
- Brands are a core feature and must be prominently featured
- All pages should reflect fashion retail terminology and metrics
- Maintain elegant, professional aesthetic throughout
- Ensure smooth animations and transitions
- Support both light and dark themes

