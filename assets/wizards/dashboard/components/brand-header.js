const { settings } = window.newspack_dashboard;

const BrandHeader = () => {
	console.log( window.newspack_dashboard.settings );
	return (
		<header
			className="newspack-dashboard__brand-header"
			style={ { backgroundColor: settings.headerBgColor } }
		>
			<div>
				<img src={ settings.logo.at( 0 ) } alt="Todo" />
			</div>
		</header>
	);
};

export default BrandHeader;
