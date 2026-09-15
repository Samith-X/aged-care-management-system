# CareConnect - Aged Care Management System

This project was developed for ICT30017 Project A - Team 2F.

CareConnect is a React prototype for an aged care management system. The main aim of the project is to bring different aged care management functions into one system instead of using separate software for each task.

## Current Version

The current project includes the React frontend prototype and the basic Supabase connection and database setup.

### Version history

- v1.0 - Initial aged care management prototype
- v1.1 - Fixed room allocation issues and improved the interface
- v1.2 - Added Supabase connection and database foundation

The latest main branch also includes the Supabase database schema and environment setup example.

## Main Features

The prototype currently includes:

- Dashboard
- Member / resident management
- Staff management
- Service management
- Scheduling
- Facility management
- Room reservations
- Maintenance issues
- Inventory management
- Medication records
- Reports
- Settings
- Mock login page

## Member Management

Users can:

- add and search residents
- view resident profiles
- record care plan information
- record medications
- add family and emergency contacts
- assign care team members
- assign rooms

Room allocation is connected with Facility Management. When a resident is assigned to a room, the prototype updates the room status to Occupied.

## Staff Management

The staff section includes:

- staff profiles
- role and employment information
- qualifications
- credentials
- availability
- active/inactive status

## Service Management

Services can include:

- service name and description
- expected duration
- activity checklist
- required staff qualifications
- required facility
- active/inactive status

## Scheduling

The scheduling section connects members, services and staff.

The prototype includes:

- service selection
- member selection
- staff selection
- date and time
- facility/room information
- simple conflict checking
- cancellation

## Facility Management

Facility Management includes:

- room records
- room availability
- resident room reservations
- cancellation of reservations
- maintenance issues

## Inventory

The inventory section includes:

- inventory items
- stock quantity
- minimum stock levels
- low stock identification
- stock adjustment
- medication stock

## Technology Used

- React
- Vite
- React Router
- JavaScript
- CSS
- Supabase
- PostgreSQL
- GitHub

The frontend currently still uses localStorage for most prototype operations.

Supabase has been connected and the database structure has been created so the team can progressively replace the local prototype data with database operations.

## Supabase Setup

The project uses the existing Team 2F Supabase project.

The database schema is available in:

```text
database/careconnect_supabase_schema.sql
