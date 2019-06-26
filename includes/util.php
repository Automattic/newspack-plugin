<?php
/**
 * Useful functions.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Clean variables using sanitize_text_field. Arrays are cleaned recursively.
 * Non-scalar values are ignored.
 *
 * @param string|array $var Data to sanitize.
 * @return string|array
 */
function newspack_clean( $var ) {
	if ( is_array( $var ) ) {
		return array_map( 'newspack_clean', $var );
	} else {
		return is_scalar( $var ) ? sanitize_text_field( $var ) : $var;
	}
}

/**
 * Converts a string (e.g. 'yes' or 'no') to a bool.
 *
 * @param string $string String to convert.
 * @return bool
 */
function newspack_string_to_bool( $string ) {
	return is_bool( $string ) ? $string : ( 'yes' === $string || 1 === $string || 'true' === $string || '1' === $string );
}

/**
 * Activate the Newspack theme (installing it if necessary).
 *
 * @return bool | WP_Error True on success. WP_Error on failure.
 */
function newspack_install_activate_theme() {
	$theme_slug = 'newspack-theme';
	$theme_url  = 'https://github.com/Automattic/newspack-theme/archive/master.zip';

	$theme_object = wp_get_theme( $theme_slug );
	if ( ! $theme_object->exists() ) {
		require_once ABSPATH . 'wp-admin/includes/file.php';
		include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		include_once ABSPATH . 'wp-admin/includes/theme.php';
		WP_Filesystem();

		$skin     = new \Automatic_Upgrader_Skin();
		$upgrader = new \Theme_Upgrader( $skin );
		$success  = $upgrader->install( $theme_url );

		if ( is_wp_error( $success ) ) {
			return $success;
		} else if ( $success ) {
			// Make sure `-master` or `-1.0.1` etc. are not in the theme folder name.
			// We just want the folder name to be the theme slug.
			$theme_object    = $upgrader->theme_info();
			$theme_folder    = $theme_object->get_template_directory();
			$expected_folder = $theme_object->get_theme_root() . '/' . $theme_slug;
			if ( $theme_folder !== $expected_folder ) {
				rename( $theme_folder, $expected_folder );
			}
		} else {
			return new \WP_Error(
				'newspack_theme_failed_install',
				__( 'Newspack theme installation failed.', 'newspack' )
			);
		}
	}

	switch_theme( $theme_slug );
	return true;
}

/**
 * Get full list of currency codes. Copied from https://github.com/woocommerce/woocommerce/blob/master/includes/wc-core-functions.php
 *
 * @return array
 */
function newspack_currencies() {
	$currencies = array(
		'AED' => __( 'United Arab Emirates dirham', 'woocommerce' ),
		'AFN' => __( 'Afghan afghani', 'woocommerce' ),
		'ALL' => __( 'Albanian lek', 'woocommerce' ),
		'AMD' => __( 'Armenian dram', 'woocommerce' ),
		'ANG' => __( 'Netherlands Antillean guilder', 'woocommerce' ),
		'AOA' => __( 'Angolan kwanza', 'woocommerce' ),
		'ARS' => __( 'Argentine peso', 'woocommerce' ),
		'AUD' => __( 'Australian dollar', 'woocommerce' ),
		'AWG' => __( 'Aruban florin', 'woocommerce' ),
		'AZN' => __( 'Azerbaijani manat', 'woocommerce' ),
		'BAM' => __( 'Bosnia and Herzegovina convertible mark', 'woocommerce' ),
		'BBD' => __( 'Barbadian dollar', 'woocommerce' ),
		'BDT' => __( 'Bangladeshi taka', 'woocommerce' ),
		'BGN' => __( 'Bulgarian lev', 'woocommerce' ),
		'BHD' => __( 'Bahraini dinar', 'woocommerce' ),
		'BIF' => __( 'Burundian franc', 'woocommerce' ),
		'BMD' => __( 'Bermudian dollar', 'woocommerce' ),
		'BND' => __( 'Brunei dollar', 'woocommerce' ),
		'BOB' => __( 'Bolivian boliviano', 'woocommerce' ),
		'BRL' => __( 'Brazilian real', 'woocommerce' ),
		'BSD' => __( 'Bahamian dollar', 'woocommerce' ),
		'BTC' => __( 'Bitcoin', 'woocommerce' ),
		'BTN' => __( 'Bhutanese ngultrum', 'woocommerce' ),
		'BWP' => __( 'Botswana pula', 'woocommerce' ),
		'BYR' => __( 'Belarusian ruble (old)', 'woocommerce' ),
		'BYN' => __( 'Belarusian ruble', 'woocommerce' ),
		'BZD' => __( 'Belize dollar', 'woocommerce' ),
		'CAD' => __( 'Canadian dollar', 'woocommerce' ),
		'CDF' => __( 'Congolese franc', 'woocommerce' ),
		'CHF' => __( 'Swiss franc', 'woocommerce' ),
		'CLP' => __( 'Chilean peso', 'woocommerce' ),
		'CNY' => __( 'Chinese yuan', 'woocommerce' ),
		'COP' => __( 'Colombian peso', 'woocommerce' ),
		'CRC' => __( 'Costa Rican col&oacute;n', 'woocommerce' ),
		'CUC' => __( 'Cuban convertible peso', 'woocommerce' ),
		'CUP' => __( 'Cuban peso', 'woocommerce' ),
		'CVE' => __( 'Cape Verdean escudo', 'woocommerce' ),
		'CZK' => __( 'Czech koruna', 'woocommerce' ),
		'DJF' => __( 'Djiboutian franc', 'woocommerce' ),
		'DKK' => __( 'Danish krone', 'woocommerce' ),
		'DOP' => __( 'Dominican peso', 'woocommerce' ),
		'DZD' => __( 'Algerian dinar', 'woocommerce' ),
		'EGP' => __( 'Egyptian pound', 'woocommerce' ),
		'ERN' => __( 'Eritrean nakfa', 'woocommerce' ),
		'ETB' => __( 'Ethiopian birr', 'woocommerce' ),
		'EUR' => __( 'Euro', 'woocommerce' ),
		'FJD' => __( 'Fijian dollar', 'woocommerce' ),
		'FKP' => __( 'Falkland Islands pound', 'woocommerce' ),
		'GBP' => __( 'Pound sterling', 'woocommerce' ),
		'GEL' => __( 'Georgian lari', 'woocommerce' ),
		'GGP' => __( 'Guernsey pound', 'woocommerce' ),
		'GHS' => __( 'Ghana cedi', 'woocommerce' ),
		'GIP' => __( 'Gibraltar pound', 'woocommerce' ),
		'GMD' => __( 'Gambian dalasi', 'woocommerce' ),
		'GNF' => __( 'Guinean franc', 'woocommerce' ),
		'GTQ' => __( 'Guatemalan quetzal', 'woocommerce' ),
		'GYD' => __( 'Guyanese dollar', 'woocommerce' ),
		'HKD' => __( 'Hong Kong dollar', 'woocommerce' ),
		'HNL' => __( 'Honduran lempira', 'woocommerce' ),
		'HRK' => __( 'Croatian kuna', 'woocommerce' ),
		'HTG' => __( 'Haitian gourde', 'woocommerce' ),
		'HUF' => __( 'Hungarian forint', 'woocommerce' ),
		'IDR' => __( 'Indonesian rupiah', 'woocommerce' ),
		'ILS' => __( 'Israeli new shekel', 'woocommerce' ),
		'IMP' => __( 'Manx pound', 'woocommerce' ),
		'INR' => __( 'Indian rupee', 'woocommerce' ),
		'IQD' => __( 'Iraqi dinar', 'woocommerce' ),
		'IRR' => __( 'Iranian rial', 'woocommerce' ),
		'IRT' => __( 'Iranian toman', 'woocommerce' ),
		'ISK' => __( 'Icelandic kr&oacute;na', 'woocommerce' ),
		'JEP' => __( 'Jersey pound', 'woocommerce' ),
		'JMD' => __( 'Jamaican dollar', 'woocommerce' ),
		'JOD' => __( 'Jordanian dinar', 'woocommerce' ),
		'JPY' => __( 'Japanese yen', 'woocommerce' ),
		'KES' => __( 'Kenyan shilling', 'woocommerce' ),
		'KGS' => __( 'Kyrgyzstani som', 'woocommerce' ),
		'KHR' => __( 'Cambodian riel', 'woocommerce' ),
		'KMF' => __( 'Comorian franc', 'woocommerce' ),
		'KPW' => __( 'North Korean won', 'woocommerce' ),
		'KRW' => __( 'South Korean won', 'woocommerce' ),
		'KWD' => __( 'Kuwaiti dinar', 'woocommerce' ),
		'KYD' => __( 'Cayman Islands dollar', 'woocommerce' ),
		'KZT' => __( 'Kazakhstani tenge', 'woocommerce' ),
		'LAK' => __( 'Lao kip', 'woocommerce' ),
		'LBP' => __( 'Lebanese pound', 'woocommerce' ),
		'LKR' => __( 'Sri Lankan rupee', 'woocommerce' ),
		'LRD' => __( 'Liberian dollar', 'woocommerce' ),
		'LSL' => __( 'Lesotho loti', 'woocommerce' ),
		'LYD' => __( 'Libyan dinar', 'woocommerce' ),
		'MAD' => __( 'Moroccan dirham', 'woocommerce' ),
		'MDL' => __( 'Moldovan leu', 'woocommerce' ),
		'MGA' => __( 'Malagasy ariary', 'woocommerce' ),
		'MKD' => __( 'Macedonian denar', 'woocommerce' ),
		'MMK' => __( 'Burmese kyat', 'woocommerce' ),
		'MNT' => __( 'Mongolian t&ouml;gr&ouml;g', 'woocommerce' ),
		'MOP' => __( 'Macanese pataca', 'woocommerce' ),
		'MRO' => __( 'Mauritanian ouguiya', 'woocommerce' ),
		'MUR' => __( 'Mauritian rupee', 'woocommerce' ),
		'MVR' => __( 'Maldivian rufiyaa', 'woocommerce' ),
		'MWK' => __( 'Malawian kwacha', 'woocommerce' ),
		'MXN' => __( 'Mexican peso', 'woocommerce' ),
		'MYR' => __( 'Malaysian ringgit', 'woocommerce' ),
		'MZN' => __( 'Mozambican metical', 'woocommerce' ),
		'NAD' => __( 'Namibian dollar', 'woocommerce' ),
		'NGN' => __( 'Nigerian naira', 'woocommerce' ),
		'NIO' => __( 'Nicaraguan c&oacute;rdoba', 'woocommerce' ),
		'NOK' => __( 'Norwegian krone', 'woocommerce' ),
		'NPR' => __( 'Nepalese rupee', 'woocommerce' ),
		'NZD' => __( 'New Zealand dollar', 'woocommerce' ),
		'OMR' => __( 'Omani rial', 'woocommerce' ),
		'PAB' => __( 'Panamanian balboa', 'woocommerce' ),
		'PEN' => __( 'Sol', 'woocommerce' ),
		'PGK' => __( 'Papua New Guinean kina', 'woocommerce' ),
		'PHP' => __( 'Philippine peso', 'woocommerce' ),
		'PKR' => __( 'Pakistani rupee', 'woocommerce' ),
		'PLN' => __( 'Polish z&#x142;oty', 'woocommerce' ),
		'PRB' => __( 'Transnistrian ruble', 'woocommerce' ),
		'PYG' => __( 'Paraguayan guaran&iacute;', 'woocommerce' ),
		'QAR' => __( 'Qatari riyal', 'woocommerce' ),
		'RON' => __( 'Romanian leu', 'woocommerce' ),
		'RSD' => __( 'Serbian dinar', 'woocommerce' ),
		'RUB' => __( 'Russian ruble', 'woocommerce' ),
		'RWF' => __( 'Rwandan franc', 'woocommerce' ),
		'SAR' => __( 'Saudi riyal', 'woocommerce' ),
		'SBD' => __( 'Solomon Islands dollar', 'woocommerce' ),
		'SCR' => __( 'Seychellois rupee', 'woocommerce' ),
		'SDG' => __( 'Sudanese pound', 'woocommerce' ),
		'SEK' => __( 'Swedish krona', 'woocommerce' ),
		'SGD' => __( 'Singapore dollar', 'woocommerce' ),
		'SHP' => __( 'Saint Helena pound', 'woocommerce' ),
		'SLL' => __( 'Sierra Leonean leone', 'woocommerce' ),
		'SOS' => __( 'Somali shilling', 'woocommerce' ),
		'SRD' => __( 'Surinamese dollar', 'woocommerce' ),
		'SSP' => __( 'South Sudanese pound', 'woocommerce' ),
		'STD' => __( 'S&atilde;o Tom&eacute; and Pr&iacute;ncipe dobra', 'woocommerce' ),
		'SYP' => __( 'Syrian pound', 'woocommerce' ),
		'SZL' => __( 'Swazi lilangeni', 'woocommerce' ),
		'THB' => __( 'Thai baht', 'woocommerce' ),
		'TJS' => __( 'Tajikistani somoni', 'woocommerce' ),
		'TMT' => __( 'Turkmenistan manat', 'woocommerce' ),
		'TND' => __( 'Tunisian dinar', 'woocommerce' ),
		'TOP' => __( 'Tongan pa&#x2bb;anga', 'woocommerce' ),
		'TRY' => __( 'Turkish lira', 'woocommerce' ),
		'TTD' => __( 'Trinidad and Tobago dollar', 'woocommerce' ),
		'TWD' => __( 'New Taiwan dollar', 'woocommerce' ),
		'TZS' => __( 'Tanzanian shilling', 'woocommerce' ),
		'UAH' => __( 'Ukrainian hryvnia', 'woocommerce' ),
		'UGX' => __( 'Ugandan shilling', 'woocommerce' ),
		'USD' => __( 'United States (US) dollar', 'woocommerce' ),
		'UYU' => __( 'Uruguayan peso', 'woocommerce' ),
		'UZS' => __( 'Uzbekistani som', 'woocommerce' ),
		'VEF' => __( 'Venezuelan bol&iacute;var', 'woocommerce' ),
		'VES' => __( 'Bol&iacute;var soberano', 'woocommerce' ),
		'VND' => __( 'Vietnamese &#x111;&#x1ed3;ng', 'woocommerce' ),
		'VUV' => __( 'Vanuatu vatu', 'woocommerce' ),
		'WST' => __( 'Samoan t&#x101;l&#x101;', 'woocommerce' ),
		'XAF' => __( 'Central African CFA franc', 'woocommerce' ),
		'XCD' => __( 'East Caribbean dollar', 'woocommerce' ),
		'XOF' => __( 'West African CFA franc', 'woocommerce' ),
		'XPF' => __( 'CFP franc', 'woocommerce' ),
		'YER' => __( 'Yemeni rial', 'woocommerce' ),
		'ZAR' => __( 'South African rand', 'woocommerce' ),
		'ZMW' => __( 'Zambian kwacha', 'woocommerce' ),
	);
	return $currencies;
}

/**
 * Get full list of country codes. Copied from https://github.com/woocommerce/woocommerce/blob/master/includes/class-wc-countries.php
 *
 * @return array
 */
function newspack_countries() {
	$countries = array(
		'AF' => __( 'Afghanistan', 'woocommerce' ),
		'AX' => __( '&#197;land Islands', 'woocommerce' ),
		'AL' => __( 'Albania', 'woocommerce' ),
		'DZ' => __( 'Algeria', 'woocommerce' ),
		'AS' => __( 'American Samoa', 'woocommerce' ),
		'AD' => __( 'Andorra', 'woocommerce' ),
		'AO' => __( 'Angola', 'woocommerce' ),
		'AI' => __( 'Anguilla', 'woocommerce' ),
		'AQ' => __( 'Antarctica', 'woocommerce' ),
		'AG' => __( 'Antigua and Barbuda', 'woocommerce' ),
		'AR' => __( 'Argentina', 'woocommerce' ),
		'AM' => __( 'Armenia', 'woocommerce' ),
		'AW' => __( 'Aruba', 'woocommerce' ),
		'AU' => __( 'Australia', 'woocommerce' ),
		'AT' => __( 'Austria', 'woocommerce' ),
		'AZ' => __( 'Azerbaijan', 'woocommerce' ),
		'BS' => __( 'Bahamas', 'woocommerce' ),
		'BH' => __( 'Bahrain', 'woocommerce' ),
		'BD' => __( 'Bangladesh', 'woocommerce' ),
		'BB' => __( 'Barbados', 'woocommerce' ),
		'BY' => __( 'Belarus', 'woocommerce' ),
		'BE' => __( 'Belgium', 'woocommerce' ),
		'PW' => __( 'Belau', 'woocommerce' ),
		'BZ' => __( 'Belize', 'woocommerce' ),
		'BJ' => __( 'Benin', 'woocommerce' ),
		'BM' => __( 'Bermuda', 'woocommerce' ),
		'BT' => __( 'Bhutan', 'woocommerce' ),
		'BO' => __( 'Bolivia', 'woocommerce' ),
		'BQ' => __( 'Bonaire, Saint Eustatius and Saba', 'woocommerce' ),
		'BA' => __( 'Bosnia and Herzegovina', 'woocommerce' ),
		'BW' => __( 'Botswana', 'woocommerce' ),
		'BV' => __( 'Bouvet Island', 'woocommerce' ),
		'BR' => __( 'Brazil', 'woocommerce' ),
		'IO' => __( 'British Indian Ocean Territory', 'woocommerce' ),
		'BN' => __( 'Brunei', 'woocommerce' ),
		'BG' => __( 'Bulgaria', 'woocommerce' ),
		'BF' => __( 'Burkina Faso', 'woocommerce' ),
		'BI' => __( 'Burundi', 'woocommerce' ),
		'KH' => __( 'Cambodia', 'woocommerce' ),
		'CM' => __( 'Cameroon', 'woocommerce' ),
		'CA' => __( 'Canada', 'woocommerce' ),
		'CV' => __( 'Cape Verde', 'woocommerce' ),
		'KY' => __( 'Cayman Islands', 'woocommerce' ),
		'CF' => __( 'Central African Republic', 'woocommerce' ),
		'TD' => __( 'Chad', 'woocommerce' ),
		'CL' => __( 'Chile', 'woocommerce' ),
		'CN' => __( 'China', 'woocommerce' ),
		'CX' => __( 'Christmas Island', 'woocommerce' ),
		'CC' => __( 'Cocos (Keeling) Islands', 'woocommerce' ),
		'CO' => __( 'Colombia', 'woocommerce' ),
		'KM' => __( 'Comoros', 'woocommerce' ),
		'CG' => __( 'Congo (Brazzaville)', 'woocommerce' ),
		'CD' => __( 'Congo (Kinshasa)', 'woocommerce' ),
		'CK' => __( 'Cook Islands', 'woocommerce' ),
		'CR' => __( 'Costa Rica', 'woocommerce' ),
		'HR' => __( 'Croatia', 'woocommerce' ),
		'CU' => __( 'Cuba', 'woocommerce' ),
		'CW' => __( 'Cura&ccedil;ao', 'woocommerce' ),
		'CY' => __( 'Cyprus', 'woocommerce' ),
		'CZ' => __( 'Czech Republic', 'woocommerce' ),
		'DK' => __( 'Denmark', 'woocommerce' ),
		'DJ' => __( 'Djibouti', 'woocommerce' ),
		'DM' => __( 'Dominica', 'woocommerce' ),
		'DO' => __( 'Dominican Republic', 'woocommerce' ),
		'EC' => __( 'Ecuador', 'woocommerce' ),
		'EG' => __( 'Egypt', 'woocommerce' ),
		'SV' => __( 'El Salvador', 'woocommerce' ),
		'GQ' => __( 'Equatorial Guinea', 'woocommerce' ),
		'ER' => __( 'Eritrea', 'woocommerce' ),
		'EE' => __( 'Estonia', 'woocommerce' ),
		'ET' => __( 'Ethiopia', 'woocommerce' ),
		'FK' => __( 'Falkland Islands', 'woocommerce' ),
		'FO' => __( 'Faroe Islands', 'woocommerce' ),
		'FJ' => __( 'Fiji', 'woocommerce' ),
		'FI' => __( 'Finland', 'woocommerce' ),
		'FR' => __( 'France', 'woocommerce' ),
		'GF' => __( 'French Guiana', 'woocommerce' ),
		'PF' => __( 'French Polynesia', 'woocommerce' ),
		'TF' => __( 'French Southern Territories', 'woocommerce' ),
		'GA' => __( 'Gabon', 'woocommerce' ),
		'GM' => __( 'Gambia', 'woocommerce' ),
		'GE' => __( 'Georgia', 'woocommerce' ),
		'DE' => __( 'Germany', 'woocommerce' ),
		'GH' => __( 'Ghana', 'woocommerce' ),
		'GI' => __( 'Gibraltar', 'woocommerce' ),
		'GR' => __( 'Greece', 'woocommerce' ),
		'GL' => __( 'Greenland', 'woocommerce' ),
		'GD' => __( 'Grenada', 'woocommerce' ),
		'GP' => __( 'Guadeloupe', 'woocommerce' ),
		'GU' => __( 'Guam', 'woocommerce' ),
		'GT' => __( 'Guatemala', 'woocommerce' ),
		'GG' => __( 'Guernsey', 'woocommerce' ),
		'GN' => __( 'Guinea', 'woocommerce' ),
		'GW' => __( 'Guinea-Bissau', 'woocommerce' ),
		'GY' => __( 'Guyana', 'woocommerce' ),
		'HT' => __( 'Haiti', 'woocommerce' ),
		'HM' => __( 'Heard Island and McDonald Islands', 'woocommerce' ),
		'HN' => __( 'Honduras', 'woocommerce' ),
		'HK' => __( 'Hong Kong', 'woocommerce' ),
		'HU' => __( 'Hungary', 'woocommerce' ),
		'IS' => __( 'Iceland', 'woocommerce' ),
		'IN' => __( 'India', 'woocommerce' ),
		'ID' => __( 'Indonesia', 'woocommerce' ),
		'IR' => __( 'Iran', 'woocommerce' ),
		'IQ' => __( 'Iraq', 'woocommerce' ),
		'IE' => __( 'Ireland', 'woocommerce' ),
		'IM' => __( 'Isle of Man', 'woocommerce' ),
		'IL' => __( 'Israel', 'woocommerce' ),
		'IT' => __( 'Italy', 'woocommerce' ),
		'CI' => __( 'Ivory Coast', 'woocommerce' ),
		'JM' => __( 'Jamaica', 'woocommerce' ),
		'JP' => __( 'Japan', 'woocommerce' ),
		'JE' => __( 'Jersey', 'woocommerce' ),
		'JO' => __( 'Jordan', 'woocommerce' ),
		'KZ' => __( 'Kazakhstan', 'woocommerce' ),
		'KE' => __( 'Kenya', 'woocommerce' ),
		'KI' => __( 'Kiribati', 'woocommerce' ),
		'KW' => __( 'Kuwait', 'woocommerce' ),
		'KG' => __( 'Kyrgyzstan', 'woocommerce' ),
		'LA' => __( 'Laos', 'woocommerce' ),
		'LV' => __( 'Latvia', 'woocommerce' ),
		'LB' => __( 'Lebanon', 'woocommerce' ),
		'LS' => __( 'Lesotho', 'woocommerce' ),
		'LR' => __( 'Liberia', 'woocommerce' ),
		'LY' => __( 'Libya', 'woocommerce' ),
		'LI' => __( 'Liechtenstein', 'woocommerce' ),
		'LT' => __( 'Lithuania', 'woocommerce' ),
		'LU' => __( 'Luxembourg', 'woocommerce' ),
		'MO' => __( 'Macao S.A.R., China', 'woocommerce' ),
		'MK' => __( 'North Macedonia', 'woocommerce' ),
		'MG' => __( 'Madagascar', 'woocommerce' ),
		'MW' => __( 'Malawi', 'woocommerce' ),
		'MY' => __( 'Malaysia', 'woocommerce' ),
		'MV' => __( 'Maldives', 'woocommerce' ),
		'ML' => __( 'Mali', 'woocommerce' ),
		'MT' => __( 'Malta', 'woocommerce' ),
		'MH' => __( 'Marshall Islands', 'woocommerce' ),
		'MQ' => __( 'Martinique', 'woocommerce' ),
		'MR' => __( 'Mauritania', 'woocommerce' ),
		'MU' => __( 'Mauritius', 'woocommerce' ),
		'YT' => __( 'Mayotte', 'woocommerce' ),
		'MX' => __( 'Mexico', 'woocommerce' ),
		'FM' => __( 'Micronesia', 'woocommerce' ),
		'MD' => __( 'Moldova', 'woocommerce' ),
		'MC' => __( 'Monaco', 'woocommerce' ),
		'MN' => __( 'Mongolia', 'woocommerce' ),
		'ME' => __( 'Montenegro', 'woocommerce' ),
		'MS' => __( 'Montserrat', 'woocommerce' ),
		'MA' => __( 'Morocco', 'woocommerce' ),
		'MZ' => __( 'Mozambique', 'woocommerce' ),
		'MM' => __( 'Myanmar', 'woocommerce' ),
		'NA' => __( 'Namibia', 'woocommerce' ),
		'NR' => __( 'Nauru', 'woocommerce' ),
		'NP' => __( 'Nepal', 'woocommerce' ),
		'NL' => __( 'Netherlands', 'woocommerce' ),
		'NC' => __( 'New Caledonia', 'woocommerce' ),
		'NZ' => __( 'New Zealand', 'woocommerce' ),
		'NI' => __( 'Nicaragua', 'woocommerce' ),
		'NE' => __( 'Niger', 'woocommerce' ),
		'NG' => __( 'Nigeria', 'woocommerce' ),
		'NU' => __( 'Niue', 'woocommerce' ),
		'NF' => __( 'Norfolk Island', 'woocommerce' ),
		'MP' => __( 'Northern Mariana Islands', 'woocommerce' ),
		'KP' => __( 'North Korea', 'woocommerce' ),
		'NO' => __( 'Norway', 'woocommerce' ),
		'OM' => __( 'Oman', 'woocommerce' ),
		'PK' => __( 'Pakistan', 'woocommerce' ),
		'PS' => __( 'Palestinian Territory', 'woocommerce' ),
		'PA' => __( 'Panama', 'woocommerce' ),
		'PG' => __( 'Papua New Guinea', 'woocommerce' ),
		'PY' => __( 'Paraguay', 'woocommerce' ),
		'PE' => __( 'Peru', 'woocommerce' ),
		'PH' => __( 'Philippines', 'woocommerce' ),
		'PN' => __( 'Pitcairn', 'woocommerce' ),
		'PL' => __( 'Poland', 'woocommerce' ),
		'PT' => __( 'Portugal', 'woocommerce' ),
		'PR' => __( 'Puerto Rico', 'woocommerce' ),
		'QA' => __( 'Qatar', 'woocommerce' ),
		'RE' => __( 'Reunion', 'woocommerce' ),
		'RO' => __( 'Romania', 'woocommerce' ),
		'RU' => __( 'Russia', 'woocommerce' ),
		'RW' => __( 'Rwanda', 'woocommerce' ),
		'BL' => __( 'Saint Barth&eacute;lemy', 'woocommerce' ),
		'SH' => __( 'Saint Helena', 'woocommerce' ),
		'KN' => __( 'Saint Kitts and Nevis', 'woocommerce' ),
		'LC' => __( 'Saint Lucia', 'woocommerce' ),
		'MF' => __( 'Saint Martin (French part)', 'woocommerce' ),
		'SX' => __( 'Saint Martin (Dutch part)', 'woocommerce' ),
		'PM' => __( 'Saint Pierre and Miquelon', 'woocommerce' ),
		'VC' => __( 'Saint Vincent and the Grenadines', 'woocommerce' ),
		'SM' => __( 'San Marino', 'woocommerce' ),
		'ST' => __( 'S&atilde;o Tom&eacute; and Pr&iacute;ncipe', 'woocommerce' ),
		'SA' => __( 'Saudi Arabia', 'woocommerce' ),
		'SN' => __( 'Senegal', 'woocommerce' ),
		'RS' => __( 'Serbia', 'woocommerce' ),
		'SC' => __( 'Seychelles', 'woocommerce' ),
		'SL' => __( 'Sierra Leone', 'woocommerce' ),
		'SG' => __( 'Singapore', 'woocommerce' ),
		'SK' => __( 'Slovakia', 'woocommerce' ),
		'SI' => __( 'Slovenia', 'woocommerce' ),
		'SB' => __( 'Solomon Islands', 'woocommerce' ),
		'SO' => __( 'Somalia', 'woocommerce' ),
		'ZA' => __( 'South Africa', 'woocommerce' ),
		'GS' => __( 'South Georgia/Sandwich Islands', 'woocommerce' ),
		'KR' => __( 'South Korea', 'woocommerce' ),
		'SS' => __( 'South Sudan', 'woocommerce' ),
		'ES' => __( 'Spain', 'woocommerce' ),
		'LK' => __( 'Sri Lanka', 'woocommerce' ),
		'SD' => __( 'Sudan', 'woocommerce' ),
		'SR' => __( 'Suriname', 'woocommerce' ),
		'SJ' => __( 'Svalbard and Jan Mayen', 'woocommerce' ),
		'SZ' => __( 'Swaziland', 'woocommerce' ),
		'SE' => __( 'Sweden', 'woocommerce' ),
		'CH' => __( 'Switzerland', 'woocommerce' ),
		'SY' => __( 'Syria', 'woocommerce' ),
		'TW' => __( 'Taiwan', 'woocommerce' ),
		'TJ' => __( 'Tajikistan', 'woocommerce' ),
		'TZ' => __( 'Tanzania', 'woocommerce' ),
		'TH' => __( 'Thailand', 'woocommerce' ),
		'TL' => __( 'Timor-Leste', 'woocommerce' ),
		'TG' => __( 'Togo', 'woocommerce' ),
		'TK' => __( 'Tokelau', 'woocommerce' ),
		'TO' => __( 'Tonga', 'woocommerce' ),
		'TT' => __( 'Trinidad and Tobago', 'woocommerce' ),
		'TN' => __( 'Tunisia', 'woocommerce' ),
		'TR' => __( 'Turkey', 'woocommerce' ),
		'TM' => __( 'Turkmenistan', 'woocommerce' ),
		'TC' => __( 'Turks and Caicos Islands', 'woocommerce' ),
		'TV' => __( 'Tuvalu', 'woocommerce' ),
		'UG' => __( 'Uganda', 'woocommerce' ),
		'UA' => __( 'Ukraine', 'woocommerce' ),
		'AE' => __( 'United Arab Emirates', 'woocommerce' ),
		'GB' => __( 'United Kingdom (UK)', 'woocommerce' ),
		'US' => __( 'United States (US)', 'woocommerce' ),
		'UM' => __( 'United States (US) Minor Outlying Islands', 'woocommerce' ),
		'UY' => __( 'Uruguay', 'woocommerce' ),
		'UZ' => __( 'Uzbekistan', 'woocommerce' ),
		'VU' => __( 'Vanuatu', 'woocommerce' ),
		'VA' => __( 'Vatican', 'woocommerce' ),
		'VE' => __( 'Venezuela', 'woocommerce' ),
		'VN' => __( 'Vietnam', 'woocommerce' ),
		'VG' => __( 'Virgin Islands (British)', 'woocommerce' ),
		'VI' => __( 'Virgin Islands (US)', 'woocommerce' ),
		'WF' => __( 'Wallis and Futuna', 'woocommerce' ),
		'EH' => __( 'Western Sahara', 'woocommerce' ),
		'WS' => __( 'Samoa', 'woocommerce' ),
		'YE' => __( 'Yemen', 'woocommerce' ),
		'ZM' => __( 'Zambia', 'woocommerce' ),
		'ZW' => __( 'Zimbabwe', 'woocommerce' ),
	);
	return $countries;
}

/**
 * Convert an associative array into array of objects prepped for selectControl.
 *
 * @param array $arr Array to be converted.
 * @return array
 */
function newspack_select_prepare( $arr ) {
	$result = array();
	foreach ( $arr as $key => $value ) {
		$result[] = [
			'label' => $value,
			'value' => $key,
		];
	}
	return $result;
}
