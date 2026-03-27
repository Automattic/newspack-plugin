<?php // phpcs:disable WordPress.Files.FileName.InvalidClassFileName, Squiz.Commenting.FunctionComment.Missing, Squiz.Commenting.ClassComment.Missing, Squiz.Commenting.VariableComment.Missing, Squiz.Commenting.FileComment.Missing, Generic.Files.OneObjectStructurePerFile.MultipleFound, Universal.Files.SeparateFunctionsFromOO.Mixed

if ( ! class_exists( 'Newspack_Newsletters_Contacts' ) ) {
	class Newspack_Newsletters_Contacts {}
}

if ( ! class_exists( 'Newspack_Newsletters' ) ) {
	class Newspack_Newsletters {
		const EMAIL_HTML_META = 'newspack_email_html';

		public static function service_provider() {
			return get_option( 'newspack_newsletters_service_provider', false );
		}

		public static function get_service_provider() {
			return new Newspack_Newsletters_Service_Provider();
		}

		public static function is_service_provider_configured() {
			return true;
		}
	}
}

if ( ! class_exists( 'Newspack_Newsletters_Settings' ) ) {
	class Newspack_Newsletters_Settings {}
}

if ( ! class_exists( 'Newspack_Newsletters_Subscription' ) ) {
	class Newspack_Newsletters_Subscription {
		public static function get_lists() {
			return [
				[
					'active' => true,
					'name'   => 'test',
					'id'     => '123',
				],
			];
		}
	}
}

if ( ! class_exists( 'Newspack_Newsletters_Service_Provider' ) ) {
	class Newspack_Newsletters_Service_Provider {
		public $service = 'mailchimp';

		public static function get_lists() {
			return [
				[
					'active' => true,
					'name'   => 'test',
					'id'     => '123',
				],
			];
		}
	}
}
