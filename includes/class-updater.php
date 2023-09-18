<?php
/**
 * Newspack Plugin Updater.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Class for the plugin updater.
 */
final class Updater {
	/**
	 * Constructor.
	 *
	 * @param string $plugin            Plugin.
	 * @param string $plugin_file       Plugin file.
	 * @param string $github_repository GitHub repository.
	 */
	public function __construct( $plugin, $plugin_file, $github_repository ) {
		$this->plugin            = $plugin;
		$this->plugin_file       = $plugin_file;
		$this->github_repository = $github_repository;
		$this->plugin_data       = \get_plugin_data( $plugin_file );
		add_filter( 'site_transient_update_plugins', [ $this, 'add_update_data' ] );
	}

	/**
	 * Get GitHub API url.
	 *
	 * @return string
	 */
	private function get_api_url() {
		return 'https://api.github.com/repos/' . $this->github_repository . '/releases/latest';
	}

	/**
	 * Get data on the latest release.
	 *
	 * @return array|bool
	 */
	private function fetch_latest_github_data() {
		$response = wp_safe_remote_get( $this->get_api_url() );

		if ( is_wp_error( $response ) ) {
			return false;
		}

		$body = wp_remote_retrieve_body( $response );
		if ( empty( $body ) ) {
			return false;
		}

		$data = json_decode( $body, true );
		if ( empty( $data ) ) {
			return false;
		}

		if ( empty( $data['tag_name'] ) || empty( $data['zipball_url'] ) ) {
			return false;
		}

		return $data;
	}

	/**
	 * Get the available release data.
	 */
	private function get_release_data() {
		$transient_key = sprintf( 'newspack_updater_%s', $this->plugin );
		$release_data  = get_transient( $transient_key );
		$expiration    = 60 * 60 * 12; // 12 hours.
		if ( false === $release_data ) {
			$github_data = self::fetch_latest_github_data();
			if ( $github_data ) {
				$release_data = (object) [
					'id'            => $this->plugin,
					'slug'          => $this->plugin_data['TextDomain'],
					'plugin'        => $this->plugin,
					'new_version'   => str_replace( 'v', '', $github_data['tag_name'] ),
					'url'           => $this->plugin_data['PluginURI'],
					'package'       => $github_data['zipball_url'],
					'icons'         => [],
					'banners'       => [],
					'banners_rtl'   => [],
					'tested'        => '',
					'requires_php'  => '',
					'compatibility' => new \stdClass(),
				];
			} else {
				$release_data = [];
				$expiration   = 60 * 5; // 5 minutes.
			}
		}
		set_transient( $transient_key, $release_data, $expiration );
		return $release_data;
	}

	/**
	 * Add update data.
	 *
	 * @param array $transient Transient data.
	 * @return array
	 */
	public function add_update_data( $transient ) {
		$data = self::get_release_data();
		if ( empty( $data ) ) {
			return $transient;
		}
		if ( version_compare( $this->plugin_data['Version'], $data->new_version, '<' ) ) {
			$transient->response[ $this->plugin ] = $data;
		} else {
			$transient->no_update[ $this->plugin ] = $data;
		}
		return $transient;
	}
}
new Updater( 'newspack-plugin/newspack.php', NEWSPACK_PLUGIN_FILE, 'Automattic/newspack-plugin' );
