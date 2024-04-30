import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

import { SectionHeader, Notice } from '@components';
import GoogleOAuth from './google';
import Plugins from './plugins';
import Mailchimp from './mailchimp';
import FivetranConnection from './fivetran';
import Recaptcha from './recaptcha';
import Webhooks from './webhooks';

const { connections } = window.newspackSettings.sections;
