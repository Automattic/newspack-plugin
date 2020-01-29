# PluginToggle

PluginToggle presents ActionCards for one or more plugins.

Each ActionCard displays the name and description of the plugin. Clicking the ToggleControl installs/activates or uninstalls the plugin. If a plugin is installed, there will be a Handoff link on the right. Optionally the href and label of this link can be overridden.

The component accepts a shouldRefreshAfterUpdate param. If true, the page will be reloaded after any plugin is installed or uninstalled. Updating ensures that the WordPress dashboard accurately represents current state, e.g. that newly installed plugins appear in menus.

### Usage

ActionCards for WooCommerce and Instant Articles for WP. Both will have Handoff links.

```
<PluginToggle
	plugins={ {
		woocommerce: true,
		'fb-instant-articles': true,
	} }
/>
```

ActionCards for WooCommerce and Instant Articles for WP with custom text and URL for links.

```
<PluginToggle
	plugins={ {
		woocommerce: {
			actionText: __( 'Use WooCommerce' ),
			href: '/wp-admin/admin.php?page=newspack',
		},
		'fb-instant-articles': {
			actionText: __( 'Configure Instant Articles' ),
			href: '/wp-admin/admin.php?page=newspack',
		},
	} }
/>
```

Same as above, configured to refresh page after plugin state changes.

```
<PluginToggle
	shouldRefreshAfterUpdate={ true }
	plugins={ {
		woocommerce: {
			actionText: __( 'Use WooCommerce' ),
			href: '/wp-admin/admin.php?page=newspack',
		},
		'fb-instant-articles': {
			actionText: __( 'Configure Instant Articles' ),
			href: '/wp-admin/admin.php?page=newspack',
		},
	} }
/>
```
