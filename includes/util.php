<?php
/**
 * Useful functions.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

define( 'NEWSPACK_API_NAMESPACE', 'newspack/v1' );
define( 'NEWSPACK_API_URL', get_site_url() . '/wp-json/' . NEWSPACK_API_NAMESPACE );

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
 * Currencies options, copied from WooCommerce.
 * https://github.com/woocommerce/woocommerce/blob/master/includes/wc-core-functions.php
 */
function newspack_get_currencies_options() {
	$currencies       = [
		'AED' => __( 'United Arab Emirates dirham', 'newspack' ),
		'AFN' => __( 'Afghan afghani', 'newspack' ),
		'ALL' => __( 'Albanian lek', 'newspack' ),
		'AMD' => __( 'Armenian dram', 'newspack' ),
		'ANG' => __( 'Netherlands Antillean guilder', 'newspack' ),
		'AOA' => __( 'Angolan kwanza', 'newspack' ),
		'ARS' => __( 'Argentine peso', 'newspack' ),
		'AUD' => __( 'Australian dollar', 'newspack' ),
		'AWG' => __( 'Aruban florin', 'newspack' ),
		'AZN' => __( 'Azerbaijani manat', 'newspack' ),
		'BAM' => __( 'Bosnia and Herzegovina convertible mark', 'newspack' ),
		'BBD' => __( 'Barbadian dollar', 'newspack' ),
		'BDT' => __( 'Bangladeshi taka', 'newspack' ),
		'BGN' => __( 'Bulgarian lev', 'newspack' ),
		'BHD' => __( 'Bahraini dinar', 'newspack' ),
		'BIF' => __( 'Burundian franc', 'newspack' ),
		'BMD' => __( 'Bermudian dollar', 'newspack' ),
		'BND' => __( 'Brunei dollar', 'newspack' ),
		'BOB' => __( 'Bolivian boliviano', 'newspack' ),
		'BRL' => __( 'Brazilian real', 'newspack' ),
		'BSD' => __( 'Bahamian dollar', 'newspack' ),
		'BTC' => __( 'Bitcoin', 'newspack' ),
		'BTN' => __( 'Bhutanese ngultrum', 'newspack' ),
		'BWP' => __( 'Botswana pula', 'newspack' ),
		'BYR' => __( 'Belarusian ruble (old)', 'newspack' ),
		'BYN' => __( 'Belarusian ruble', 'newspack' ),
		'BZD' => __( 'Belize dollar', 'newspack' ),
		'CAD' => __( 'Canadian dollar', 'newspack' ),
		'CDF' => __( 'Congolese franc', 'newspack' ),
		'CHF' => __( 'Swiss franc', 'newspack' ),
		'CLP' => __( 'Chilean peso', 'newspack' ),
		'CNY' => __( 'Chinese yuan', 'newspack' ),
		'COP' => __( 'Colombian peso', 'newspack' ),
		'CRC' => __( 'Costa Rican col&oacute;n', 'newspack' ),
		'CUC' => __( 'Cuban convertible peso', 'newspack' ),
		'CUP' => __( 'Cuban peso', 'newspack' ),
		'CVE' => __( 'Cape Verdean escudo', 'newspack' ),
		'CZK' => __( 'Czech koruna', 'newspack' ),
		'DJF' => __( 'Djiboutian franc', 'newspack' ),
		'DKK' => __( 'Danish krone', 'newspack' ),
		'DOP' => __( 'Dominican peso', 'newspack' ),
		'DZD' => __( 'Algerian dinar', 'newspack' ),
		'EGP' => __( 'Egyptian pound', 'newspack' ),
		'ERN' => __( 'Eritrean nakfa', 'newspack' ),
		'ETB' => __( 'Ethiopian birr', 'newspack' ),
		'EUR' => __( 'Euro', 'newspack' ),
		'FJD' => __( 'Fijian dollar', 'newspack' ),
		'FKP' => __( 'Falkland Islands pound', 'newspack' ),
		'GBP' => __( 'Pound sterling', 'newspack' ),
		'GEL' => __( 'Georgian lari', 'newspack' ),
		'GGP' => __( 'Guernsey pound', 'newspack' ),
		'GHS' => __( 'Ghana cedi', 'newspack' ),
		'GIP' => __( 'Gibraltar pound', 'newspack' ),
		'GMD' => __( 'Gambian dalasi', 'newspack' ),
		'GNF' => __( 'Guinean franc', 'newspack' ),
		'GTQ' => __( 'Guatemalan quetzal', 'newspack' ),
		'GYD' => __( 'Guyanese dollar', 'newspack' ),
		'HKD' => __( 'Hong Kong dollar', 'newspack' ),
		'HNL' => __( 'Honduran lempira', 'newspack' ),
		'HRK' => __( 'Croatian kuna', 'newspack' ),
		'HTG' => __( 'Haitian gourde', 'newspack' ),
		'HUF' => __( 'Hungarian forint', 'newspack' ),
		'IDR' => __( 'Indonesian rupiah', 'newspack' ),
		'ILS' => __( 'Israeli new shekel', 'newspack' ),
		'IMP' => __( 'Manx pound', 'newspack' ),
		'INR' => __( 'Indian rupee', 'newspack' ),
		'IQD' => __( 'Iraqi dinar', 'newspack' ),
		'IRR' => __( 'Iranian rial', 'newspack' ),
		'IRT' => __( 'Iranian toman', 'newspack' ),
		'ISK' => __( 'Icelandic kr&oacute;na', 'newspack' ),
		'JEP' => __( 'Jersey pound', 'newspack' ),
		'JMD' => __( 'Jamaican dollar', 'newspack' ),
		'JOD' => __( 'Jordanian dinar', 'newspack' ),
		'JPY' => __( 'Japanese yen', 'newspack' ),
		'KES' => __( 'Kenyan shilling', 'newspack' ),
		'KGS' => __( 'Kyrgyzstani som', 'newspack' ),
		'KHR' => __( 'Cambodian riel', 'newspack' ),
		'KMF' => __( 'Comorian franc', 'newspack' ),
		'KPW' => __( 'North Korean won', 'newspack' ),
		'KRW' => __( 'South Korean won', 'newspack' ),
		'KWD' => __( 'Kuwaiti dinar', 'newspack' ),
		'KYD' => __( 'Cayman Islands dollar', 'newspack' ),
		'KZT' => __( 'Kazakhstani tenge', 'newspack' ),
		'LAK' => __( 'Lao kip', 'newspack' ),
		'LBP' => __( 'Lebanese pound', 'newspack' ),
		'LKR' => __( 'Sri Lankan rupee', 'newspack' ),
		'LRD' => __( 'Liberian dollar', 'newspack' ),
		'LSL' => __( 'Lesotho loti', 'newspack' ),
		'LYD' => __( 'Libyan dinar', 'newspack' ),
		'MAD' => __( 'Moroccan dirham', 'newspack' ),
		'MDL' => __( 'Moldovan leu', 'newspack' ),
		'MGA' => __( 'Malagasy ariary', 'newspack' ),
		'MKD' => __( 'Macedonian denar', 'newspack' ),
		'MMK' => __( 'Burmese kyat', 'newspack' ),
		'MNT' => __( 'Mongolian t&ouml;gr&ouml;g', 'newspack' ),
		'MOP' => __( 'Macanese pataca', 'newspack' ),
		'MRU' => __( 'Mauritanian ouguiya', 'newspack' ),
		'MUR' => __( 'Mauritian rupee', 'newspack' ),
		'MVR' => __( 'Maldivian rufiyaa', 'newspack' ),
		'MWK' => __( 'Malawian kwacha', 'newspack' ),
		'MXN' => __( 'Mexican peso', 'newspack' ),
		'MYR' => __( 'Malaysian ringgit', 'newspack' ),
		'MZN' => __( 'Mozambican metical', 'newspack' ),
		'NAD' => __( 'Namibian dollar', 'newspack' ),
		'NGN' => __( 'Nigerian naira', 'newspack' ),
		'NIO' => __( 'Nicaraguan c&oacute;rdoba', 'newspack' ),
		'NOK' => __( 'Norwegian krone', 'newspack' ),
		'NPR' => __( 'Nepalese rupee', 'newspack' ),
		'NZD' => __( 'New Zealand dollar', 'newspack' ),
		'OMR' => __( 'Omani rial', 'newspack' ),
		'PAB' => __( 'Panamanian balboa', 'newspack' ),
		'PEN' => __( 'Sol', 'newspack' ),
		'PGK' => __( 'Papua New Guinean kina', 'newspack' ),
		'PHP' => __( 'Philippine peso', 'newspack' ),
		'PKR' => __( 'Pakistani rupee', 'newspack' ),
		'PLN' => __( 'Polish z&#x142;oty', 'newspack' ),
		'PRB' => __( 'Transnistrian ruble', 'newspack' ),
		'PYG' => __( 'Paraguayan guaran&iacute;', 'newspack' ),
		'QAR' => __( 'Qatari riyal', 'newspack' ),
		'RON' => __( 'Romanian leu', 'newspack' ),
		'RSD' => __( 'Serbian dinar', 'newspack' ),
		'RUB' => __( 'Russian ruble', 'newspack' ),
		'RWF' => __( 'Rwandan franc', 'newspack' ),
		'SAR' => __( 'Saudi riyal', 'newspack' ),
		'SBD' => __( 'Solomon Islands dollar', 'newspack' ),
		'SCR' => __( 'Seychellois rupee', 'newspack' ),
		'SDG' => __( 'Sudanese pound', 'newspack' ),
		'SEK' => __( 'Swedish krona', 'newspack' ),
		'SGD' => __( 'Singapore dollar', 'newspack' ),
		'SHP' => __( 'Saint Helena pound', 'newspack' ),
		'SLL' => __( 'Sierra Leonean leone', 'newspack' ),
		'SOS' => __( 'Somali shilling', 'newspack' ),
		'SRD' => __( 'Surinamese dollar', 'newspack' ),
		'SSP' => __( 'South Sudanese pound', 'newspack' ),
		'STN' => __( 'S&atilde;o Tom&eacute; and Pr&iacute;ncipe dobra', 'newspack' ),
		'SYP' => __( 'Syrian pound', 'newspack' ),
		'SZL' => __( 'Swazi lilangeni', 'newspack' ),
		'THB' => __( 'Thai baht', 'newspack' ),
		'TJS' => __( 'Tajikistani somoni', 'newspack' ),
		'TMT' => __( 'Turkmenistan manat', 'newspack' ),
		'TND' => __( 'Tunisian dinar', 'newspack' ),
		'TOP' => __( 'Tongan pa&#x2bb;anga', 'newspack' ),
		'TRY' => __( 'Turkish lira', 'newspack' ),
		'TTD' => __( 'Trinidad and Tobago dollar', 'newspack' ),
		'TWD' => __( 'New Taiwan dollar', 'newspack' ),
		'TZS' => __( 'Tanzanian shilling', 'newspack' ),
		'UAH' => __( 'Ukrainian hryvnia', 'newspack' ),
		'UGX' => __( 'Ugandan shilling', 'newspack' ),
		'USD' => __( 'United States (US) dollar', 'newspack' ),
		'UYU' => __( 'Uruguayan peso', 'newspack' ),
		'UZS' => __( 'Uzbekistani som', 'newspack' ),
		'VEF' => __( 'Venezuelan bol&iacute;var', 'newspack' ),
		'VES' => __( 'Bol&iacute;var soberano', 'newspack' ),
		'VND' => __( 'Vietnamese &#x111;&#x1ed3;ng', 'newspack' ),
		'VUV' => __( 'Vanuatu vatu', 'newspack' ),
		'WST' => __( 'Samoan t&#x101;l&#x101;', 'newspack' ),
		'XAF' => __( 'Central African CFA franc', 'newspack' ),
		'XCD' => __( 'East Caribbean dollar', 'newspack' ),
		'XOF' => __( 'West African CFA franc', 'newspack' ),
		'XPF' => __( 'CFP franc', 'newspack' ),
		'YER' => __( 'Yemeni rial', 'newspack' ),
		'ZAR' => __( 'South African rand', 'newspack' ),
		'ZMW' => __( 'Zambian kwacha', 'newspack' ),
	];
	$currency_options = [
		[
			'value' => null,
			'label' => __( '-- Select --', 'newspack' ),
		],
	];
	foreach ( $currencies as $code => $currency ) {
		$currency_options[] = [
			'value' => $code,
			'label' => html_entity_decode( $currency ),
		];
	}
	return $currency_options;
}

/**
 * Get symbol of a currency.
 * https://github.com/woocommerce/woocommerce/blob/master/includes/wc-core-functions.php#L845
 *
 * @param string $currency_code Currency code.
 */
function newspack_get_currency_symbol( $currency_code ) {
	$symbols = [
		'AED' => '&#x62f;.&#x625;',
		'AFN' => '&#x60b;',
		'ALL' => 'L',
		'AMD' => 'AMD',
		'ANG' => '&fnof;',
		'AOA' => 'Kz',
		'ARS' => '&#36;',
		'AUD' => '&#36;',
		'AWG' => 'Afl.',
		'AZN' => 'AZN',
		'BAM' => 'KM',
		'BBD' => '&#36;',
		'BDT' => '&#2547;&nbsp;',
		'BGN' => '&#1083;&#1074;.',
		'BHD' => '.&#x62f;.&#x628;',
		'BIF' => 'Fr',
		'BMD' => '&#36;',
		'BND' => '&#36;',
		'BOB' => 'Bs.',
		'BRL' => '&#82;&#36;',
		'BSD' => '&#36;',
		'BTC' => '&#3647;',
		'BTN' => 'Nu.',
		'BWP' => 'P',
		'BYR' => 'Br',
		'BYN' => 'Br',
		'BZD' => '&#36;',
		'CAD' => '&#36;',
		'CDF' => 'Fr',
		'CHF' => '&#67;&#72;&#70;',
		'CLP' => '&#36;',
		'CNY' => '&yen;',
		'COP' => '&#36;',
		'CRC' => '&#x20a1;',
		'CUC' => '&#36;',
		'CUP' => '&#36;',
		'CVE' => '&#36;',
		'CZK' => '&#75;&#269;',
		'DJF' => 'Fr',
		'DKK' => 'DKK',
		'DOP' => 'RD&#36;',
		'DZD' => '&#x62f;.&#x62c;',
		'EGP' => 'EGP',
		'ERN' => 'Nfk',
		'ETB' => 'Br',
		'EUR' => '&euro;',
		'FJD' => '&#36;',
		'FKP' => '&pound;',
		'GBP' => '&pound;',
		'GEL' => '&#x20be;',
		'GGP' => '&pound;',
		'GHS' => '&#x20b5;',
		'GIP' => '&pound;',
		'GMD' => 'D',
		'GNF' => 'Fr',
		'GTQ' => 'Q',
		'GYD' => '&#36;',
		'HKD' => '&#36;',
		'HNL' => 'L',
		'HRK' => 'kn',
		'HTG' => 'G',
		'HUF' => '&#70;&#116;',
		'IDR' => 'Rp',
		'ILS' => '&#8362;',
		'IMP' => '&pound;',
		'INR' => '&#8377;',
		'IQD' => '&#x639;.&#x62f;',
		'IRR' => '&#xfdfc;',
		'IRT' => '&#x062A;&#x0648;&#x0645;&#x0627;&#x0646;',
		'ISK' => 'kr.',
		'JEP' => '&pound;',
		'JMD' => '&#36;',
		'JOD' => '&#x62f;.&#x627;',
		'JPY' => '&yen;',
		'KES' => 'KSh',
		'KGS' => '&#x441;&#x43e;&#x43c;',
		'KHR' => '&#x17db;',
		'KMF' => 'Fr',
		'KPW' => '&#x20a9;',
		'KRW' => '&#8361;',
		'KWD' => '&#x62f;.&#x643;',
		'KYD' => '&#36;',
		'KZT' => '&#8376;',
		'LAK' => '&#8365;',
		'LBP' => '&#x644;.&#x644;',
		'LKR' => '&#xdbb;&#xdd4;',
		'LRD' => '&#36;',
		'LSL' => 'L',
		'LYD' => '&#x644;.&#x62f;',
		'MAD' => '&#x62f;.&#x645;.',
		'MDL' => 'MDL',
		'MGA' => 'Ar',
		'MKD' => '&#x434;&#x435;&#x43d;',
		'MMK' => 'Ks',
		'MNT' => '&#x20ae;',
		'MOP' => 'P',
		'MRU' => 'UM',
		'MUR' => '&#x20a8;',
		'MVR' => '.&#x783;',
		'MWK' => 'MK',
		'MXN' => '&#36;',
		'MYR' => '&#82;&#77;',
		'MZN' => 'MT',
		'NAD' => 'N&#36;',
		'NGN' => '&#8358;',
		'NIO' => 'C&#36;',
		'NOK' => '&#107;&#114;',
		'NPR' => '&#8360;',
		'NZD' => '&#36;',
		'OMR' => '&#x631;.&#x639;.',
		'PAB' => 'B/.',
		'PEN' => 'S/',
		'PGK' => 'K',
		'PHP' => '&#8369;',
		'PKR' => '&#8360;',
		'PLN' => '&#122;&#322;',
		'PRB' => '&#x440;.',
		'PYG' => '&#8370;',
		'QAR' => '&#x631;.&#x642;',
		'RMB' => '&yen;',
		'RON' => 'lei',
		'RSD' => '&#1088;&#1089;&#1076;',
		'RUB' => '&#8381;',
		'RWF' => 'Fr',
		'SAR' => '&#x631;.&#x633;',
		'SBD' => '&#36;',
		'SCR' => '&#x20a8;',
		'SDG' => '&#x62c;.&#x633;.',
		'SEK' => '&#107;&#114;',
		'SGD' => '&#36;',
		'SHP' => '&pound;',
		'SLL' => 'Le',
		'SOS' => 'Sh',
		'SRD' => '&#36;',
		'SSP' => '&pound;',
		'STN' => 'Db',
		'SYP' => '&#x644;.&#x633;',
		'SZL' => 'L',
		'THB' => '&#3647;',
		'TJS' => '&#x405;&#x41c;',
		'TMT' => 'm',
		'TND' => '&#x62f;.&#x62a;',
		'TOP' => 'T&#36;',
		'TRY' => '&#8378;',
		'TTD' => '&#36;',
		'TWD' => '&#78;&#84;&#36;',
		'TZS' => 'Sh',
		'UAH' => '&#8372;',
		'UGX' => 'UGX',
		'USD' => '&#36;',
		'UYU' => '&#36;',
		'UZS' => 'UZS',
		'VEF' => 'Bs F',
		'VES' => 'Bs.S',
		'VND' => '&#8363;',
		'VUV' => 'Vt',
		'WST' => 'T',
		'XAF' => 'CFA',
		'XCD' => '&#36;',
		'XOF' => 'CFA',
		'XPF' => 'Fr',
		'YER' => '&#xfdfc;',
		'ZAR' => '&#82;',
		'ZMW' => 'ZK',
	];

	return isset( $symbols[ $currency_code ] ) ? $symbols[ $currency_code ] : '';
}
