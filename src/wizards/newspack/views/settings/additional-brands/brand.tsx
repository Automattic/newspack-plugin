import { __ } from '@wordpress/i18n';
import { addQueryArgs, cleanForSlug } from '@wordpress/url';
import { Fragment, useState, useEffect } from '@wordpress/element';

import {
	Router,
	Card,
	Grid,
	Button,
	SectionHeader,
	TextControl,
	ImageUpload,
	ColorPicker,
	SelectControl,
	RadioControl,
	hooks,
} from '../../../../../components/src';

const { useParams } = Router;

import './style.scss';

const additionalBrandsSettings =
	window.newspackSettings[ 'additional-brands' ].sections.additionalBrands;

const registeredThemeColors = additionalBrandsSettings.themeColors;
const menuLocations = additionalBrandsSettings.menuLocations;
const availableMenus = additionalBrandsSettings.menus;

export default function Brand( {
	brands = [],
	saveBrand,
	wizardApiFetch,
	fetchLogoAttachment,
}: {
	brands: Brand[];
	editBrand?: number;
	saveBrand: ( brandId: number, brand: Brand ) => void;
	wizardApiFetch: WizardApiFetch;
	fetchLogoAttachment: ( brandId: number, logoId: number ) => void;
} ) {
	const [ brand, updateBrand ] = hooks.useObjectState< Brand >( {
		id: 0,
		name: 'Brand Name',
		slug: 'brand-slug',
		meta: {
			_show_page_on_front: 0,
			_custom_url: 'yes',
			_logo: 0,
			_theme_colors: [],
			_menus: [],
		},
		count: 0,
		description: '',
		link: '',
		taxonomy: '',
		parent: 0,
	} );
	const [ publicPages, setPublicPages ] = useState<
		{
			id: string;
			title: { rendered: string };
		}[]
	>( [] );
	const [ showOnFrontSelect, setShowOnFrontSelect ] =
		useState< string >( 'no' );

	const { brandId } = useParams();
	const selectedBrand = brands.find( ( { id } ) => id === Number( brandId ) );

	useEffect( () => {
		if (
			typeof selectedBrand?.meta._logo === 'number' &&
			selectedBrand?.meta._logo
		) {
			fetchLogoAttachment( Number( brandId ), selectedBrand.meta._logo );
		}
	}, [ selectedBrand?.meta._logo ] );

	useEffect( () => {
		if ( selectedBrand ) {
			updateBrand( selectedBrand );
			setShowOnFrontSelect(
				selectedBrand.meta._show_page_on_front ? 'yes' : 'no'
			);
		}
	}, [ selectedBrand ] );

	const getThemeColor = ( colorName: string | undefined ) => {
		const color = brand.meta._theme_colors?.find(
			c => colorName === c.name
		)?.color;
		return color
			? color
			: Object.values( registeredThemeColors ).find(
					c => colorName === c.theme_mod_name
			  )?.default;
	};

	const hasCustomThemeColor = ( colorName: string | undefined ) => {
		const color = brand.meta._theme_colors?.find(
			c => colorName === c.name
		)?.color;
		return color ? true : false;
	};

	const setThemeColor = (
		name: string | undefined,
		color: string | undefined
	) => {
		const themeColors = brand.meta._theme_colors
			? brand.meta._theme_colors
			: [];
		const colorIndex = themeColors.findIndex(
			_color => name === _color.name
		);
		let updatedThemeColors: ThemeColorsMeta[] = [];

		if ( ! color && colorIndex > -1 ) {
			// Resetting default color.
			themeColors.splice( colorIndex, 1 );
			updatedThemeColors = themeColors;
		} else if ( color && colorIndex > -1 ) {
			// Updating color.
			updatedThemeColors = themeColors.map( _color =>
				name === _color.name ? { ..._color, color } : _color
			);
		} else if ( color && colorIndex === -1 && name ) {
			// Adding color.
			updatedThemeColors = [ ...themeColors, { name, color } ];
		} else if ( ! color && colorIndex === -1 ) {
			// should not happen.
			return;
		}

		return updateBrand( {
			meta: {
				...brand.meta,
				_theme_colors: updatedThemeColors,
			},
		} );
	};

	const updateSlugFromName = ( e: React.ChangeEvent< HTMLInputElement > ) => {
		if ( '' === brand.slug ) {
			updateBrand( { slug: cleanForSlug( e.target.value ) } );
		}
	};

	const updateShowOnFront = ( value: string ) => {
		if ( 'no' === value ) {
			updateBrand( { meta: { ...brand.meta, _show_page_on_front: 0 } } );
		}
		setShowOnFrontSelect( value );
	};

	const updateMenus = ( location: string, menu: number ) => {
		const menus = brand.meta._menus ? brand.meta._menus : [];
		const menuIndex = menus.findIndex(
			_menu => location === _menu.location
		);

		const updatedMenus =
			menuIndex > -1
				? menus.map( _menu =>
						location === _menu.location ? { ..._menu, menu } : _menu
				  )
				: [ ...menus, { location, menu } ];

		return updateBrand( {
			meta: {
				...brand.meta,
				_menus: updatedMenus,
			},
		} );
	};

	const baseUrl = `${ window.newspack_urls.site }/${
		'no' === brand.meta._custom_url ? 'brand/' : ''
	}`;

	const fetchPublicPages = () => {
		// Limiting to 100 pages, just in case.
		wizardApiFetch(
			{
				path: addQueryArgs( '/wp/v2/pages', {
					per_page: 100,
					orderby: 'title',
					order: 'asc',
				} ),
			},
			{
				onSuccess: setPublicPages,
			}
		);
	};

	useEffect( fetchPublicPages, [] );

	// Brand is valid when it has a name, and if a page is selected to be shown in front, the page should be selected.
	const isBrandValid =
		0 < brand.name?.length &&
		( 'no' === showOnFrontSelect ||
			( 'yes' === showOnFrontSelect &&
				0 < brand.meta._show_page_on_front ) );

	function findSelectedMenu( location: string ) {
		if ( ! brand.meta._menus ) {
			return 0;
		}
		const selectedMenu = brand.meta._menus.find(
			menu => menu.location === location
		);
		return selectedMenu ? selectedMenu.menu : 0;
	}

	/**
	 * During logo fetch, the logo is set to a positive number.
	 *
	 * @return True if the logo is a positive number, false otherwise.
	 */
	function isFetchingLogo() {
		return typeof brand.meta._logo === 'number' && brand.meta._logo > 0;
	}

	return (
		<Fragment>
			<SectionHeader
				title={ __( 'Brand', 'newspack-plugin' ) }
				description={ __(
					'Set your brand identity',
					'newspack-plugin'
				) }
			/>
			<Grid gutter={ 32 }>
				<Grid columns={ 1 } gutter={ 16 }>
					<TextControl
						label={ __( 'Name', 'newspack-plugin' ) }
						value={ brand.name || '' }
						onChange={ updateBrand( 'name' ) }
						onBlur={ updateSlugFromName }
					/>
				</Grid>
				<Grid columns={ 1 } gutter={ 16 }>
					<ImageUpload
						className="newspack-brand__header__logo"
						buttonLabel={
							isFetchingLogo()
								? __( 'Fetching logo…', 'newspack-plugin' )
								: undefined
						}
						label={ __( 'Logo', 'newspack-plugin' ) }
						image={
							isFetchingLogo() ? undefined : brand.meta._logo
						}
						onChange={ ( logoId: number ) =>
							updateBrand( {
								meta: { ...brand.meta, _logo: logoId },
							} )
						}
					/>
				</Grid>
			</Grid>

			{ registeredThemeColors && (
				<SectionHeader
					title={ __( 'Colors', 'newspack-plugin' ) }
					description={ __(
						'These are the colors you can customize for this brand in the active theme',
						'newspack-plugin'
					) }
				/>
			) }

			{ registeredThemeColors &&
				registeredThemeColors.map( color => {
					return (
						<Card noBorder key={ color.theme_mod_name }>
							<ColorPicker
								className="newspack-brand__theme-mod-color-picker"
								label={
									<Fragment>
										<span>{ color.label }</span>
										{ hasCustomThemeColor(
											color.theme_mod_name
										) && (
											<Button
												variant="link"
												onClick={ () =>
													setThemeColor(
														color.theme_mod_name,
														''
													)
												}
											>
												{ __(
													'Reset default color',
													'newspack-plugin'
												) }
											</Button>
										) }
									</Fragment>
								}
								color={ getThemeColor( color.theme_mod_name ) }
								onChange={ ( newColor: string ) =>
									setThemeColor(
										color.theme_mod_name,
										newColor
									)
								}
							/>
						</Card>
					);
				} ) }

			<SectionHeader title={ __( 'Settings', 'newspack-plugin' ) } />
			<Card noBorder>
				<RadioControl
					className="newspack-brand__base-url-radio-control"
					label={ __( 'URL Base', 'newspack-plugin' ) }
					selected={ brand?.meta._custom_url || 'yes' }
					options={ [
						{
							label: __( 'Homepage', 'newspack-plugin' ),
							value: 'yes',
						},
						{
							label: __( 'Default', 'newspack-plugin' ),
							value: 'no',
						},
					] }
					onChange={ ( _custom_url: string ) =>
						updateBrand( { meta: { ...brand.meta, _custom_url } } )
					}
				/>
				<div className="newspack-brand__base-url-component">
					<span>{ baseUrl }</span>
					<TextControl
						className="newspack-brand__base-url-component__text-control"
						label={ __( 'Slug', 'newspack-plugin' ) }
						hideLabelFromVision
						withMargin={ false }
						value={ brand.slug || '' }
						onChange={ ( slug: string ) => updateBrand( { slug } ) }
					/>
				</div>
			</Card>

			<Card noBorder>
				<RadioControl
					className="newspack-brand__base-url-radio-control"
					label={ __( 'Show on Front', 'newspack-plugin' ) }
					selected={ showOnFrontSelect }
					options={ [
						{
							label: __( 'Latest posts', 'newspack-plugin' ),
							value: 'no',
						},
						{
							label: __( 'A page', 'newspack-plugin' ),
							value: 'yes',
						},
					] }
					onChange={ ( value: string ) => updateShowOnFront( value ) }
				/>
				{ 'yes' === showOnFrontSelect && (
					<SelectControl
						label={ __( 'Homepage URL', 'newspack-plugin' ) }
						value={ brand.meta._show_page_on_front || 0 }
						options={ [
							{
								label: __( 'Select a Page', 'newspack-plugin' ),
								value: 0,
								disabled: true,
							},
							...publicPages.map( page => ( {
								label: page.title.rendered,
								value: Number( page.id ),
							} ) ),
						] }
						onChange={ ( _show_page_on_front: number ) =>
							updateBrand( {
								meta: {
									...brand.meta,
									_show_page_on_front,
								},
							} )
						}
						required
					/>
				) }
			</Card>

			<SectionHeader
				title={ __( 'Menus', 'newspack-plugin' ) }
				description={ __(
					'Customize the menus for this brand',
					'newspack-plugin'
				) }
			/>

			{ menuLocations &&
				Object.keys( menuLocations ).map( location => (
					<SelectControl
						key={ location }
						label={ menuLocations[ location ] }
						value={ findSelectedMenu( location ) }
						options={ [
							{
								label: __( 'Same as site', 'newspack-plugin' ),
								value: 0,
								disabled: false,
							},
							...availableMenus,
						] }
						onChange={ ( menuId: number ) =>
							updateMenus( location, menuId )
						}
					/>
				) ) }

			<div className="newspack-buttons-card">
				<Button
					disabled={ ! isBrandValid }
					variant="primary"
					onClick={ () => saveBrand( Number( brandId ), brand ) }
				>
					{ __( 'Save', 'newspack-plugin' ) }
				</Button>
				<Button variant="secondary" href="#/">
					{ __( 'Cancel', 'newspack-plugin' ) }
				</Button>
			</div>
		</Fragment>
	);
}
