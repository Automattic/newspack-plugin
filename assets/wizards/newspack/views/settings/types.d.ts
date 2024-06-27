/**
 * reCAPTCHA state params
 */
type RecaptchaData = {
	site_key?: string;
	threshold?: string;
	use_captcha?: boolean;
	site_secret?: string;
};

/*
 * Google Analytics 4 credentials Type.
 */
type Ga4Credentials = Record< string, string >;
