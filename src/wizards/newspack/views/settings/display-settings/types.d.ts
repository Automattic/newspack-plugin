type RecirculationData = {
	relatedPostsEnabled: boolean;
	relatedPostsError: WizardApiErrorType | null;
	relatedPostsMaxAge: number;
	relatedPostsUpdated: boolean;
};

type SectionComponentProps< T > = {
	update: ( a: Partial< T > ) => void;
	data: T;
};

type DisplaySettingsData = {
	relatedPostsEnabled: boolean;
	relatedPostsError: WizardApiErrorType | null;
	relatedPostsMaxAge: number;
	relatedPostsUpdated: boolean;
	show_author_bio: boolean;
	show_author_email: boolean;
	author_bio_length: number;
	featured_image_default: string;
	post_template_default: string;
	featured_image_all_posts: string;
	post_template_all_posts: string;
	newspack_image_credits_placeholder_url: string;
	newspack_image_credits_class_name: string;
	newspack_image_credits_prefix_label: string;
	newspack_image_credits_auto_populate: boolean;
};
