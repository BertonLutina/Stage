## Question

Should feature screens keep calling flat eafc paths, and if so how do they reach Stage?

## Resolution

Yes — keep path shapes. Point `utils/api` at `/api/mobile` (Stage compat). Auto-rewrite if env still says `/api/stage`. Token refresh uses `/api/stage/auth/refresh`.

Status: closed
