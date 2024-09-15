import { render, Fragment } from '@wordpress/element';
import { NewspackIcon } from '../components/src';

export function WizardsAdminTabs( {
	title,
	tabs,
}: {
	title: string;
	tabs: Array< {
		textContent: string;
		href: string;
	} >;
} ) {
	return (
		<Fragment>
			<div className="newspack-wizard__header">
				<div className="newspack-wizard__header__inner">
					<div className="newspack-wizard__title">
						<NewspackIcon size={ 36 } />
						<div>
							<h2>{ title }</h2>
						</div>
					</div>
				</div>
			</div>
			{ tabs && (
			<div className="newspack-tabbed-navigation">
				<ul>
					{ tabs.map( ( tab, i ) => {
						return (
							<li key={ `${ tab.textContent }:${ i }` }>
								<a
									href={ tab.href }
									className={
										window.location.href === tab.href
											? 'selected'
											: ''
									}
								>
									{ tab.textContent }
								</a>
							</li>
						);
					} ) }
				</ul>
			</div>
			) }
		</Fragment>
	);
}

render(
	<WizardsAdminTabs
		title={ window.newspackWizardsAdminTabs.title }
		tabs={ window.newspackWizardsAdminTabs.tabs }
	/>,
	document.getElementById( 'newspack-wizards-admin-tabs' )
);
