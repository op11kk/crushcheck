# CrushCheck

## start local development

### start supabase local

```bash
supabase start
supabase functions serve --env-file ./supabase/.env.local --no-verify-jwt
```

### start react native local

```bash
npm i
NODE_ENV=development npx expo start
rm -rf ios
npx expo run:ios --device
```
