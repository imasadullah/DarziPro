# Product Requirements Document (PRD)

## Product Name

Tailor Shop Management System

## Version

1.0

## Overview

The Tailor Shop Management System is a desktop application designed to help tailoring businesses manage customers, body measurements, orders, payments, delivery tracking, and reporting from a single platform.

The application must work completely offline and store data locally. Optional cloud synchronization may be added in future releases.

---

# Goals

## Business Goals

* Digitize customer records.
* Eliminate paper measurement books.
* Track order progress efficiently.
* Reduce missed deliveries.
* Generate sales and revenue reports.
* Improve customer service and retrieval of historical measurements.

## User Goals

* Quickly search customers.
* Save measurements permanently.
* Create and track orders.
* Record payments and balances.
* Print receipts and order slips.

---

# User Roles

## Shop Owner

Permissions:

* Full access
* Reports
* Settings
* Customer management
* Order management
* Payment management

## Staff Member

Permissions:

* Customer management
* Measurements
* Orders
* Limited payment access

---

# Functional Requirements

## 1. Dashboard

### Description

Provide a summary of shop activities.

### Features

* Total customers
* Total active orders
* Orders due today
* Orders overdue
* Revenue today
* Revenue this month
* Recent orders list

---

## 2. Customer Management

### Description

Manage customer information.

### Features

* Add customer
* Edit customer
* Delete customer
* Search customer
* Customer profile page
* Customer order history

### Customer Fields

* Customer ID
* Full Name
* Phone Number
* Address
* Notes
* Created Date

---

## 3. Measurement Management

### Description

Store and manage body measurements.

### Features

* Add measurements
* Update measurements
* View measurement history
* Copy previous measurements

### Measurement Fields

#### Shirt

* Neck
* Chest
* Waist
* Shoulder
* Sleeve Length
* Shirt Length

#### Trouser

* Waist
* Hip
* Thigh
* Length
* Bottom Width

#### Shalwar Kameez

* Chest
* Waist
* Shoulder
* Arm Length
* Collar
* Kameez Length
* Shalwar Length

#### Notes

* Fabric instructions
* Stitching instructions
* Special requests

---

## 4. Order Management

### Description

Create and track tailoring orders.

### Features

* Create order
* Edit order
* Cancel order
* Complete order
* Deliver order
* Print order receipt

### Order Fields

* Order Number
* Customer
* Order Date
* Delivery Date
* Dress Type
* Quantity
* Fabric Details
* Stitching Notes
* Status

### Statuses

* Pending
* Cutting
* Stitching
* Finishing
* Ready
* Delivered
* Cancelled

---

## 5. Payment Management

### Description

Track payments and balances.

### Features

* Receive payment
* Record advance payment
* Record full payment
* View payment history
* Outstanding balance tracking

### Payment Fields

* Payment ID
* Order Number
* Amount
* Payment Method
* Payment Date
* Notes

### Payment Methods

* Cash
* Bank Transfer
* Easypaisa
* JazzCash

---

## 6. Receipt Printing

### Features

* Order receipt
* Payment receipt
* Delivery receipt

### Receipt Content

* Shop Name
* Customer Name
* Order Number
* Date
* Amount
* Remaining Balance

---

## 7. Search System

### Features

Search by:

* Customer Name
* Phone Number
* Order Number
* Delivery Date

---

## 8. Reports

### Daily Reports

* Orders received
* Orders delivered
* Revenue

### Monthly Reports

* Revenue summary
* Order summary
* Top customers

### Outstanding Reports

* Pending payments
* Pending deliveries

---

## 9. Notifications

### Dashboard Alerts

* Delivery due today
* Overdue orders
* Outstanding payments

---

# Non-Functional Requirements

## Performance

* Application startup under 5 seconds
* Customer search under 1 second
* Support 100,000+ customer records

## Reliability

* Automatic local backups
* Data recovery support

## Security

* User authentication
* Password protection
* Role-based access

## Usability

* Simple interface
* Keyboard shortcuts
* Responsive desktop layout

---

# Technical Requirements

## Frontend

* Angular

## Desktop Framework

* Electron

## Local Database

* SQLite

## ORM

* TypeORM

## Reporting

* PDF Generation

## Printing

* Electron Print Services

---

# Future Enhancements

## Phase 2

* Cloud synchronization
* Mobile application
* SMS notifications
* WhatsApp notifications
* Online customer portal

## Phase 3

* Multiple branches
* Inventory management
* Employee attendance
* Expense tracking
* AI-based delivery forecasting

---

# Success Metrics

* 90% reduction in paper records
* Customer search under 3 seconds
* Accurate order tracking
* Zero lost measurement records
* Increased delivery efficiency
