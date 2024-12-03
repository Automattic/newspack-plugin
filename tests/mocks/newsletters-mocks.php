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
	}
}
