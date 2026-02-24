# Content Gate — IP Check

## Purpose

Sites behind a CDN or page cache serve the same HTML to every visitor. This means the server never gets a chance to check a visitor's IP address at page-render time — every request hits the cache instead of WordPress.

The IP Check feature solves this by making an **uncached AJAX request** directly to the server. If the server determines the visitor's IP is on an allowed list, a cookie (`wp_by_ip`) is set in the browser. On subsequent page loads the cache layer sees this cookie and lets the request through to WordPress, where the back-end content-gate logic can verify the IP and grant access. In other words, the cookie acts as a cache-busting flag that opens the door for the real server-side IP check to happen.

The feature exposes a single AJAX endpoint (`newspack_content_gate_check_ip`) and a filter (`newspack_content_gate_check_ip`) that other code (e.g. the Teams for WooCommerce Memberships IP add-on) hooks into to perform the actual IP validation.

---

## Magic Link (Modal)

### How it works

Any link with `href="#login-ip"` acts as a trigger. When a visitor clicks it:

1. A modal opens with a "Checking IP..." message.
2. An AJAX POST fires to `admin-ajax.php` with `action=newspack_content_gate_check_ip`.
3. **Success** (`valid_ip: true`): the `wp_by_ip` cookie is set (3-hour TTL), a success message appears, and a "Continue" button is shown. Clicking "Continue" reloads the page — this time the cache sees the cookie and lets WordPress serve the gated content.
4. **Failure** (`valid_ip: false`): an error message is shown. No cookie is set.
5. **Network error**: an error message is shown.

### Usage

Add a link anywhere in your content or template:

```html
<a href="#login-ip">Sign in by IP</a>
```

The modal and its scripts are loaded automatically on every frontend page via `wp_footer`. No block editor interaction is needed.
