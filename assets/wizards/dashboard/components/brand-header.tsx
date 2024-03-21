/**
 * Newspack Dashboard, Brand-Header
 *
 * Displaying stored logo and header bg color in a header
 */

const { settings } = window.newspack_dashboard;

const BrandHeader = () => {
	return (
		<header
			className="newspack-dashboard__brand-header"
			style={ { backgroundColor: settings.headerBgColor } }
		>
			<div className="brand-header__inner">
				<img src={ settings.logo[ 0 ] } alt="Brand Header" />
			</div>
		</header>
	);
};

export default BrandHeader;
