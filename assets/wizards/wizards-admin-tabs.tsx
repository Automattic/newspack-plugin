import { Fragment, render } from '@wordpress/element';

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
	console.log( { title, tabs } );
	return (
		<Fragment>
			{ title }
			{ tabs.map( ( tab, index ) => {
				return <p>Tab</p>;
			} ) }
		</Fragment>
	);
}

render(
	<WizardsAdminTabs title={ 'Hello' } tabs={ window.newspackWizardsAdminTabs } />,
	document.getElementById( 'wizards-admin-tabs' )
);
