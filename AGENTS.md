# Agent Guidelines

## Hard Rules

### ⛔ NEVER Change the API URL

**The API must always remain at `stageleagues.com/api/...`**

- **Current production URLs:**
  - `EXPO_PUBLIC_STAGE_API_URL=https://stageleagues.com/api/stage`
  - `EXPO_PUBLIC_API_URL=https://stageleagues.com/api/mobile`

**Do NOT change:**
- API base URLs
- API hosts
- API paths
- Environment variable defaults for API URLs
- Any configuration pointing to `stageleagues.com/api/...`

This is a critical infrastructure constraint. Changing these URLs will break production services.

---

## General Guidelines

When working with this codebase, please follow standard development practices and ensure all changes are properly tested before deployment.
