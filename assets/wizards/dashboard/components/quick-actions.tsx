/**
 * Newspack - Dashboard, Quick Actions
 *
 * Quick Actions component provides editors quick access to content creation and viewing data relating to their site
 */

/**
 * Dependencies
 */
// WordPress
import { __ } from '@wordpress/i18n';
// Internal
import { Card, Grid } from '../../../components/src';
import { Icon, icons } from './icons';

const QuickActions = () => {
	return (
		<div className="newspack-dashboard__section">
			<h3>{ __( 'Quick actions', 'newspack-plugin' ) }</h3>
			<Grid style={ { '--np-dash-card-icon-size': '48px' } } columns={ 3 } gutter={ 24 }>
				<a href="/wp-admin/post-new.php">
					<Card className="newspack-dashboard__card">
						<div className="newspack-dashboard__card-icon">
							<Icon size={ 32 } icon={ icons.post } />
						</div>
						<h4>{ __( 'Start a new post', 'newspack-plugin' ) }</h4>
					</Card>
				</a>
				<a href="/wp-admin/post-new.php?post_type=newspack_nl_cpt">
					<Card className="newspack-dashboard__card">
						<div className="newspack-dashboard__card-icon">
							<Icon size={ 32 } icon={ icons.mail } />
						</div>
						<h4>{ __( 'Draft a newsletter', 'newspack-plugin' ) }</h4>
					</Card>
				</a>
				<a href="https://lookerstudio.google.com/u/0/reporting/b7026fea-8c2c-4c4b-be95-f582ed94f097/page/p_3eqlhk5odd">
					<Card className="newspack-dashboard__card">
						<div className="newspack-dashboard__card-icon">
							<Icon size={ 32 } icon={ icons.dashboard } />
						</div>
						<h4>{ __( 'Open data dashboard', 'newspack-plugin' ) }</h4>
					</Card>
				</a>
			</Grid>
		</div>
	);
};

export default QuickActions;
