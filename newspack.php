<?php
/**
 * Plugin Name: Newspack
 * Description: An advanced open-source publishing and revenue-generating platform for news organizations.
 * Version: 1.89.1
 * Author: Automattic
 * Author URI: https://newspack.pub/
 * License: GPL2
 * Text Domain: newspack
 * Domain Path: /languages/
 *
 * @package         Newspack_Plugin
 */

defined( 'ABSPATH' ) || exit;

define( 'NEWSPACK_PLUGIN_VERSION', '1.89.1' );

// Load language files.
load_plugin_textdomain( 'newspack-plugin', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );

// Define NEWSPACK_PLUGIN_FILE.
if ( ! defined( 'NEWSPACK_PLUGIN_FILE' ) ) {
	define( 'NEWSPACK_PLUGIN_FILE', __FILE__ );
}

// Include the main Newspack class.
if ( ! class_exists( 'Newspack' ) ) {
	include_once dirname( __FILE__ ) . '/includes/class-newspack.php';
}
