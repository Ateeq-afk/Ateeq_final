# Integrating SMS Notifications

This project currently does not send SMS notifications. The previous stubbed implementation has been removed.

If SMS support is reintroduced, integrate with a provider such as [Twilio](https://www.twilio.com/) or any other gateway that exposes an HTTP API.

## Basic Steps

1. Sign up for an account with the provider and obtain API credentials.
2. Install the provider's SDK or use `fetch`/`axios` to call their REST endpoints.
3. Create a small service module (e.g. `src/lib/sms.ts`) that exposes functions like `sendSMS`.
4. Call these functions from notification-related code where SMS messages need to be sent.
5. Handle errors gracefully and log failures for troubleshooting.

This outline can serve as a starting point when implementing real SMS functionality in the future.
