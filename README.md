# WhatsApp Visitor Management System

## Overview

A WhatsApp-based Visitor Management System designed for residential communities.

Residents can generate temporary visitor access codes directly through WhatsApp without installing any mobile application. Security guards can verify visitor codes through a simple verification interface, while administrators can manage residents and monitor visitor activity through a centralized dashboard.

---

## Problem Statement

Traditional visitor management platforms are often expensive and difficult to adopt for small residential communities.

This project aims to provide a lightweight, low-cost, and user-friendly alternative using WhatsApp as the primary communication channel.

---

## Key Features

* WhatsApp-based visitor pass generation
* Secure 4-digit visitor access tokens
* Time-limited visitor passes
* Guard verification portal
* Resident entry notifications
* Visitor activity logs
* Resident management dashboard

---

## System Workflow

### Resident Flow

Resident sends:

```text
Invite
```

↓

System generates a unique 4-digit visitor pass.

↓

Resident forwards pass to visitor.

---

### Visitor Flow

Visitor arrives at the gate and shows the pass code.

↓

Guard verifies the code.

↓

Access is granted or denied.

---

### Admin Flow

President can:

* Add residents
* Edit residents
* Disable residents
* View visitor logs

---

## Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Backend

* Supabase
* PostgreSQL
* Serverless Functions

### Integrations

* WhatsApp API
* Webhooks

---

## Development Roadmap

### Week 1

* Project Setup
* Next.js Setup
* Supabase Setup
* Database Design

### Week 2

* Admin Dashboard
* Resident Management

### Week 3

* Visitor Pass Generation

### Week 4

* Guard Verification Portal

### Week 5

* WhatsApp Integration
* Deployment

---

## Current Progress

### Completed

* GitHub Repository Setup
* Project Documentation
* Next.js Initialization
* Tailwind CSS Setup
* Homepage Customization


## Project Status

🚧 Currently In Development

---

## Author

Sajid Ahmed

GitHub: https://github.com/Ciber-One
