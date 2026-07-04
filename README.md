# Distributed Job Scheduler

A production-grade distributed job scheduling platform built with **React, Node.js, TypeScript, PostgreSQL, Redis, Prisma ORM, Docker, and Socket.IO**. The application enables users to create projects, configure queues, schedule jobs, monitor workers, analyze system performance, and manage failed jobs using a Dead Letter Queue (DLQ).

---

## Overview

Distributed Job Scheduler is designed to simulate how modern distributed background processing systems work. It provides a complete platform for managing asynchronous jobs through queues and workers while offering real-time monitoring and analytics.

The platform follows a distributed architecture where:

- Users create Projects
- Projects contain Queues
- Jobs are submitted to Queues
- Workers process Jobs asynchronously
- Scheduler promotes delayed and scheduled jobs
- Failed jobs are moved to the Dead Letter Queue (DLQ)
- Dashboard and Analytics display live system metrics

---

# Features

## Authentication

- User Registration
- Secure Login
- JWT Authentication
- Protected Routes
- Session Persistence
- User Profile Management
- Change Password

---

## Project Management

- Create Project
- Edit Project
- Delete Project
- Project Details
- Search & Filtering
- Pagination

---

## Queue Management

- Create Queue
- Edit Queue
- Delete Queue
- Pause Queue
- Resume Queue
- Retry Policy Configuration
- Priority Configuration
- Concurrency Settings
- Queue Statistics

---

## Job Management

Supports multiple job types:

- Immediate Jobs
- Delayed Jobs
- Scheduled Jobs
- Recurring Jobs
- Batch Jobs
- Draft Jobs

Operations:

- Create
- View Details
- Retry
- Cancel
- Clone
- Delete
- Bulk Operations

---

## Worker Service

- Worker Registration
- Heartbeat Monitoring
- Job Processing
- Worker Metrics
- Graceful Shutdown

---

## Scheduler Service

Responsible for:

- Delayed Job Promotion
- Scheduled Job Execution
- Recurring Job Scheduling

---

## Dead Letter Queue (DLQ)

- Failed Job Tracking
- Retry Failed Jobs
- Retry All
- Delete Failed Jobs
- Bulk Delete
- Error Information

---

## Analytics

- Total Jobs
- Running Jobs
- Queued Jobs
- Failed Jobs
- Completed Jobs
- Active Workers
- Queue Statistics
- Processing Metrics

---

## Monitoring

Live monitoring for:

- API Server
- PostgreSQL
- Redis
- Worker Service
- Scheduler Service
- Overall System Status

---

## Notifications

- Notification Center
- Mark as Read
- Delete Notifications
- Real-time Alerts

---

## User Interface

- Responsive Dashboard
- Sidebar Navigation
- Search & Filters
- Empty States
- Loading States
- Error Handling
- Modern UI Components

---

# System Architecture

```
                  React Frontend
                         │
                Axios / REST API
                         │
                  Express API Server
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
 PostgreSQL          Redis Cache      Socket.IO
       │
   Prisma ORM
       │
 ┌───────────────┐
 │               │
Worker Service  Scheduler Service
```

---

# Workflow

```
User Login
      │
      ▼
Create Project
      │
      ▼
Create Queue
      │
      ▼
Create Job
      │
      ▼
Database
      │
      ▼
Worker Picks Job
      │
      ▼
Running
      │
 ┌────┴─────┐
 │          │
Success   Failure
 │          │
 ▼          ▼
Completed  Retry
            │
            ▼
Dead Letter Queue (DLQ)
```

---

# Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Query
- Socket.IO Client

### Backend

- Node.js
- Express.js
- TypeScript

### Database

- PostgreSQL
- Prisma ORM

### Queue & Cache

- Redis

### Authentication

- JWT
- bcrypt

### DevOps

- Docker
- Docker Compose

---

# Project Structure

```
distributed-job-scheduler/

├── apps/
│   ├── api/
│   ├── web/
│   ├── worker/
│   └── scheduler/
│
├── packages/
│   ├── config/
│   └── database/
│
├── docker-compose.yml
├── package.json
└── README.md
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/rahulsheoran6401-source/distributed-job-scheduler.git
```

```bash
cd distributed-job-scheduler
```

---

## Install Dependencies

```bash
npm install
```

---

## Start PostgreSQL and Redis

```bash
docker compose up -d
```

---

## Configure Environment Variables

Create a `.env` file in the project root.

```env
DATABASE_URL=postgresql://admin:password@localhost:5432/jobscheduler?schema=public

REDIS_URL=redis://localhost:6379

JWT_SECRET=your_secret_key
```

---

## Generate Prisma Client

```bash
npx prisma generate --schema=packages/database/prisma/schema.prisma
```

---

## Push Database Schema

```bash
npx prisma db push --schema=packages/database/prisma/schema.prisma
```

---

## Run the Application

### Start API

```bash
cd apps/api
npm run dev
```

### Start Worker

```bash
cd apps/worker
npm run dev
```

### Start Scheduler

```bash
cd apps/scheduler
npm run dev
```

### Start Frontend

```bash
cd apps/web
npm run dev
```

---

# Default URLs

| Service | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3000 |
| API Documentation | http://localhost:3000/docs |

---

# Key Functionalities

- User Authentication
- Project Management
- Queue Management
- Distributed Job Processing
- Worker Heartbeats
- Scheduler Service
- Retry Mechanism
- Dead Letter Queue
- Analytics Dashboard
- System Monitoring
- Notifications
- Dockerized Development Environment

---

# Future Enhancements

- Email Notifications
- Role-Based Access Control (RBAC)
- Kubernetes Deployment
- Horizontal Worker Scaling
- Advanced Job Scheduling Rules
- Prometheus & Grafana Monitoring
- Audit Logging
- Multi-Tenant Organizations

---

---

# Author

**Rahul Sheoran**

GitHub: https://github.com/rahulsheoran6401-source

---

# License

This project is developed for educational, learning, and portfolio purposes.
