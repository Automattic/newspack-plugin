<?php // phpcs:disable WordPress.Files.FileName.InvalidClassFileName, Squiz.Commenting.FunctionComment.Missing, Squiz.Commenting.ClassComment.Missing, Squiz.Commenting.VariableComment.Missing, Squiz.Commenting.FileComment.Missing, Generic.Files.OneObjectStructurePerFile.MultipleFound, Universal.Files.SeparateFunctionsFromOO.Mixed

class Newspack_Newsletters_Settings {
	public static function get_settings_list() {
		return [];
	}
}

class Newspack_Newsletters_Subscription {
	public static function get_lists() {
		return [
			[
				'id'     => 'list-id-1',
				'name'   => 'List 1',
				'active' => false,
			],
			[
				'id'     => 'list-id-2',
				'name'   => 'List 2',
				'active' => true,
			],
		];
	}
}

class Newspack_Newsletters_Contacts {
	public static function upsert() {
		return true;
	}
}

class Newspack_Newsletters {
	public static function service_provider() {
		return 'mailchimp';
	}
	public static function is_service_provider_configured() {
		return true;
	}
}
