# BugMart — Student Testing Guide & Lab Assignment

Welcome to the **BugMart Software Testing Classroom Lab**!

BugMart is a realistic e-commerce application designed for hands-on manual testing, exploratory testing, boundary analysis, security evaluation, and professional bug reporting.

---

## 🎯 Lab Objectives

1. **Perform Exploratory & System Testing**: Test all core e-commerce features (Catalog, Search, Cart, Checkout, Auth, Orders, Admin).
2. **Apply Software Testing Principles**:
   - **Boundary Value Analysis (BVA)**: Test minimum, maximum, and edge values for quantities, discounts, ratings, prices, and name lengths.
   - **Equivalence Partitioning (EP)**: Test valid and invalid input partitions for emails, passwords, phone numbers, coupons, and addresses.
   - **Authentication & Authorization**: Verify page guards, session state, access control, and user role restrictions.
   - **Business Logic Verification**: Verify tax calculations, discount rules, stock management, and total order math.
   - **Usability & Responsive Testing**: Test mobile viewports, form layout behavior, and UI button feedback.
3. **Draft Professional Bug Reports**: Document your findings using the provided `BUG_REPORT_TEMPLATE.md`.

---

## 🔑 Lab Credentials (Fake Data Only)

- **Customer 1**: `user@bugmart.com` / `Password123`
- **Customer 2**: `jane@bugmart.com` / `Password123`
- **Admin**: `admin@bugmart.com` / `Admin123!`

---

## 🧪 Suggested Test Areas

### Area 1: Authentication & User Management
- Try registering a new user with various email formats, names, and passwords.
- Test login with valid, invalid, and edge-case credentials.
- Test logging out and inspect session state across browser tabs.

### Area 2: Product Catalog & Search
- Test category filters, min-price filtering, and sorting dropdowns.
- Test pagination controls across multiple pages.
- Search for standard keywords, empty inputs, and special characters.

### Area 3: Shopping Cart & Coupons
- Add products, modify quantities, and remove items.
- Apply coupons (e.g. `WELCOME10`, `SUPER20`, `SAVE100`, `EXPIRED50`) under various cart totals.
- Verify subtotal, tax (18%), shipping fees, and grand total math.

### Area 4: Checkout & Order Placement
- Complete checkout with different payment methods.
- Test shipping address and contact phone input fields.
- Compare order summary totals against the final recorded order history.

### Area 5: Admin Panel & Order Management
- Inspect admin dashboard controls for products, users, and orders.
- Attempt to edit products and update order status transitions.

---

## 📝 Submitting Bug Reports

When you discover a bug, fill out a copy of `instructor/BUG_REPORT_TEMPLATE.md` with detailed steps to reproduce, expected vs actual behavior, and severity classification. Good luck bug hunting!
