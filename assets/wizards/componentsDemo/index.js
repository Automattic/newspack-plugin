import '../../shared/js/public-path';

/* eslint-disable jsx-a11y/anchor-is-valid */

/**
 * Components Demo
 */

/**
 * WordPress dependencies.
 */
import { Component, Fragment, render } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Material UI dependencies.
 */
import HeaderIcon from '@material-ui/icons/Dashboard';

/**
 * Internal dependencies.
 */
import {
	ActionCard,
	ColorPicker,
	ImageUpload,
	CheckboxControl,
	Card,
	Button,
	FormattedHeader,
	Handoff,
	NewspackLogo,
	Notice,
	TextControl,
	PluginInstaller,
	PluginToggle,
	ProgressBar,
	Checklist,
	Task,
	SelectControl,
	Modal,
	Grid,
	ToggleGroup,
	WebPreview,
} from '../../components/src';

class ComponentsDemo extends Component {
	/**
	 * constructor. Demo of how the parent interacts with the components, and controls their values.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			checklistProgress: 0,
			inputTextValue1: 'Input value',
			inputTextValue2: '',
			inputNumValue: 0,
			image: null,
			selectValue1: '2nd',
			selectValue2: '',
			modalShown: false,
			showPluginInstallerWithProgressBar: false,
			toggleGroupChecked: false,
			color1: '#3366ff',
			color2: '#4ab866',
			color3: '#d94f4f',
		};
	}

	performCheckListItem = index => {
		const { checklistProgress } = this.state;
		console.log( 'Perform checklist item: ' + index );
		this.setState( { checklistProgress: Math.max( checklistProgress, index + 1 ) } );
	};

	dismissCheckListItem = index => {
		const { checklistProgress } = this.state;
		console.log( 'Skip checklist item: ' + index );
		this.setState( { checklistProgress: Math.max( checklistProgress, index + 1 ) } );
	};

	/**
	 * Render the example stub.
	 */
	render() {
		const {
			checklistProgress,
			inputTextValue1,
			inputTextValue2,
			inputNumValue,
			selectValue1,
			selectValue2,
			modalShown,
			showPluginInstallerWithProgressBar,
			actionCardToggleChecked,
			toggleGroupChecked,
			color1,
			color2,
			color3,
		} = this.state;
		return (
			<Fragment>
				<div className="newspack-logo-wrapper">
					<a href={ newspack_urls && newspack_urls.dashboard }>
						<NewspackLogo />
					</a>
				</div>
				<FormattedHeader
					headerIcon={ <HeaderIcon /> }
					headerText={ __( 'Newspack Components' ) }
					subHeaderText={ __( 'Demo of all the Newspack components' ) }
				/>
				<Grid>
					<Card>
						<FormattedHeader headerText={ __( 'Plugin toggles' ) } />
						<PluginToggle
							plugins={ {
								woocommerce: {
									shouldRefreshAfterUpdate: true,
								},
								'fb-instant-articles': {
									actionText: __( 'Configure Instant Articles' ),
									href: '/wp-admin/admin.php?page=newspack',
								},
							} }
						/>
					</Card>
					<Card>
						<FormattedHeader headerText={ __( 'Web Previews' ) } />
						<Card noBackground buttonsCard>
							<WebPreview
								url="//newspack.blog"
								label={ __( 'Preview Newspack Blog', 'newspack' ) }
								isPrimary
							/>
							<WebPreview
								url="//newspack.blog"
								renderButton={ ( { showPreview } ) => (
									<a href="#" onClick={ showPreview }>
										{ __( 'Preview Newspack Blog', 'newspack' ) }
									</a>
								) }
							/>
						</Card>
					</Card>
					<Card>
						<FormattedHeader headerText={ __( 'Color picker' ) } />
						<ColorPicker
							label={ __( 'Color Picker' ) }
							color={ color1 }
							onChange={ color => this.setState( { color1: color } ) }
						/>
						<hr />
						<ColorPicker
							hasDefaultColors
							label={ __( 'Color Picker with default colors' ) }
							color={ color2 }
							onChange={ color => this.setState( { color2: color } ) }
						/>
						<hr />
						<ColorPicker
							suggestedColors={ [
								{
									name: __( 'pale pink' ),
									color: '#f78da7',
								},
								{ name: __( 'vivid red' ), color: '#cf2e2e' },
								{
									name: __( 'luminous vivid orange' ),
									color: '#ff6900',
								},
								{
									name: __( 'luminous vivid amber' ),
									color: '#fcb900',
								},
								{
									name: __( 'light green cyan' ),
									color: '#7bdcb5',
								},
								{
									name: __( 'vivid green cyan' ),
									color: '#00d084',
								},
								{
									name: __( 'pale cyan blue' ),
									color: '#8ed1fc',
								},
								{
									name: __( 'vivid cyan blue' ),
									color: '#0693e3',
								},
								{
									name: __( 'vivid purple' ),
									color: '#9b51e0',
								},
								{
									name: __( 'very light gray' ),
									color: '#eeeeee',
								},
								{
									name: __( 'cyan bluish gray' ),
									color: '#abb8c3',
								},
								{
									name: __( 'very dark gray' ),
									color: '#313131',
								},
							] }
							label={ __( 'Color Picker with suggested colors' ) }
							color={ color3 }
							onChange={ color => this.setState( { color3: color } ) }
						/>
					</Card>
					<Card>
						<ToggleGroup
							title={ __( 'Example Toggle Group' ) }
							description={ __( 'This is the description of a toggle group.' ) }
							checked={ toggleGroupChecked }
							onChange={ checked => this.setState( { toggleGroupChecked: checked } ) }
						>
							<p>{ __( 'This is the content of the toggle group' ) }</p>
						</ToggleGroup>
					</Card>
					<Card>
						<FormattedHeader headerText={ __( 'Handoff Buttons' ) } />
						<Card noBackground buttonsCard>
							<Handoff
								modalTitle="Manage AMP"
								modalBody="Click to go to the AMP dashboard. There will be a notification bar at the top with a link to return to Newspack."
								plugin="amp"
								isTertiary
							/>
							<Handoff plugin="jetpack" />
							<Handoff plugin="google-site-kit" />
							<Handoff plugin="woocommerce" />
							<Handoff
								plugin="wordpress-seo"
								isPrimary
								editLink="/wp-admin/admin.php?page=wpseo_dashboard#top#features"
							>
								{ __( 'Specific Yoast Page' ) }
							</Handoff>
						</Card>
					</Card>
					<Card>
						<FormattedHeader headerText={ __( 'Modal' ) } />
						<Card noBackground buttonsCard>
							<Button isPrimary onClick={ () => this.setState( { modalShown: true } ) }>
								{ __( 'Open modal' ) }
							</Button>
						</Card>
						{ modalShown && (
							<Modal
								title="This is the modal title"
								onRequestClose={ () => this.setState( { modalShown: false } ) }
							>
								<p>
									{ __(
										'Based on industry research, we advise to test the modal component, and continuing this sentence so we can see how the text wraps is one good way of doing that.'
									) }
								</p>
								<Card noBackground buttonsCard>
									<Button isPrimary onClick={ () => this.setState( { modalShown: false } ) }>
										{ __( 'Dismiss' ) }
									</Button>
									<Button isDefault onClick={ () => this.setState( { modalShown: false } ) }>
										{ __( 'Also dismiss' ) }
									</Button>
								</Card>
							</Modal>
						) }
					</Card>
					<Card>
						<FormattedHeader headerText={ __( 'Notice' ) } />
						<Notice noticeText={ __( 'This is a Primary info notice.' ) } isPrimary />
						<Notice noticeText={ __( 'This is an info notice.' ) } />
						<Notice noticeText={ __( 'This is a Primary error notice.' ) } isError isPrimary />
						<Notice noticeText={ __( 'This is an error notice.' ) } isError />
						<Notice noticeText={ __( 'This is a Primary success notice.' ) } isSuccess isPrimary />
						<Notice noticeText={ __( 'This is a success notice.' ) } isSuccess />
						<Notice noticeText={ __( 'This is a Primary warning notice.' ) } isWarning isPrimary />
						<Notice noticeText={ __( 'This is a warning notice.' ) } isWarning />
					</Card>
					<Card>
						<FormattedHeader headerText={ __( 'Plugin installer: Progress Bar' ) } />
						<Card noBackground buttonsCard>
							<Button
								onClick={ () => this.setState( { showPluginInstallerWithProgressBar: true } ) }
								className="is-centered"
								isPrimary
							>
								{ __( 'Show Plugin Installer w/Progress Bar' ) }
							</Button>
						</Card>
						{ showPluginInstallerWithProgressBar && (
							<PluginInstaller
								plugins={ [ 'woocommerce', 'amp', 'wordpress-seo', 'google-site-kit' ] }
								asProgressBar
							/>
						) }
					</Card>
					<Card>
						<FormattedHeader headerText={ __( 'Plugin installer' ) } />
						<PluginInstaller
							plugins={ [ 'woocommerce', 'amp', 'wordpress-seo' ] }
							canUninstall
							onStatus={ ( { complete, pluginInfo } ) => {
								console.log(
									complete
										? 'All plugins installed successfully'
										: 'Plugin installation incomplete',
									pluginInfo
								);
							} }
						/>
					</Card>
					<Card>
						<FormattedHeader headerText={ __( 'Plugin installer (small)' ) } />
						<PluginInstaller
							plugins={ [ 'woocommerce', 'amp', 'wordpress-seo' ] }
							isSmall
							canUninstall
							onStatus={ ( { complete, pluginInfo } ) => {
								console.log(
									complete
										? 'All plugins installed successfully'
										: 'Plugin installation incomplete',
									pluginInfo
								);
							} }
						/>
					</Card>
					<Card noBackground>
						<PluginInstaller
							plugins={ [ 'woocommerce', 'amp', 'wordpress-seo' ] }
							onStatus={ ( { complete, pluginInfo } ) => {
								console.log(
									complete
										? 'All plugins installed successfully'
										: 'Plugin installation incomplete',
									pluginInfo
								);
							} }
						/>
					</Card>
					<Card noBackground>
						<PluginInstaller
							plugins={ [ 'woocommerce', 'amp', 'wordpress-seo' ] }
							isSmall
							onStatus={ ( { complete, pluginInfo } ) => {
								console.log(
									complete
										? 'All plugins installed successfully'
										: 'Plugin installation incomplete',
									pluginInfo
								);
							} }
						/>
					</Card>
					<FormattedHeader headerText={ __( 'Action cards' ) } />
					<ActionCard
						title="Example One"
						description="Has an action button."
						actionText="Install"
						onClick={ () => {
							console.log( 'Install clicked' );
						} }
					/>
					<ActionCard
						title="Example Two"
						description="Has action button and secondary button (visible on hover)."
						actionText={ __( 'Edit' ) }
						secondaryActionText={ __( 'Delete' ) }
						onClick={ () => {
							console.log( 'Edit clicked' );
						} }
						onSecondaryActionClick={ () => {
							console.log( 'Delete clicked' );
						} }
					/>
					<ActionCard
						title="Example Three"
						description="Waiting/in-progress state, no action button."
						actionText="Installing..."
						isWaiting
					/>
					<ActionCard
						title="Example Four"
						description="Error notification"
						actionText="Install"
						onClick={ () => {
							console.log( 'Install clicked' );
						} }
						notification={
							<Fragment>
								Plugin cannot be installed <a href="#">Retry</a> | <a href="#">Documentation</a>
							</Fragment>
						}
						notificationLevel="error"
					/>
					<ActionCard
						title="Example Five"
						description="Warning notification, action button"
						notification={
							<Fragment>
								There is a new version available. <a href="#">View details</a> or{' '}
								<a href="#">update now</a>
							</Fragment>
						}
						notificationLevel="warning"
					/>
					<ActionCard
						title="Example Six"
						description="Static text, no button"
						actionText="Active"
					/>
					<ActionCard
						title="Example Seven"
						description="Static text, secondary action button."
						actionText="Active"
						secondaryActionText={ __( 'Delete' ) }
						onSecondaryActionClick={ () => {
							console.log( 'Delete clicked' );
						} }
					/>
					<ActionCard
						title="Example Eight"
						description="Image with link and action button."
						actionText="Set Up"
						onClick={ () => {
							console.log( 'Set Up' );
						} }
						image="//s1.wp.com/wp-content/themes/h4/landing/marketing/pages/hp-jan-2019/media/man-with-shadow.jpg"
						imageLink="https://wordpress.com"
					/>
					<ActionCard
						title="Example Nine"
						description="Action Card with Toggle Control."
						actionText={ actionCardToggleChecked && 'Set Up' }
						onClick={ () => {
							console.log( 'Set Up' );
						} }
						toggleOnChange={ checked => this.setState( { actionCardToggleChecked: checked } ) }
						toggleChecked={ actionCardToggleChecked }
					/>
					<ActionCard
						badge="Premium"
						title="Example Ten"
						description="An example of an action card with a badge."
						actionText="Install"
						onClick={ () => {
							console.log( 'Install clicked' );
						} }
					/>
					<ActionCard
						isSmall
						title="Example Eleven (small)"
						description="An example of a small action card."
						actionText="Install"
						onClick={ () => {
							console.log( 'Install clicked' );
						} }
					/>
					<ActionCard
						title="Handoff"
						description="An example of an action card with Handoff."
						actionText="Configure"
						handoff="jetpack"
					/>
					<ActionCard
						title="Handoff"
						description="An example of an action card with Handoff and EditLink."
						actionText="Configure"
						handoff="jetpack"
						editLink="admin.php?page=jetpack#/settings"
					/>
					<FormattedHeader headerText={ __( 'Checklist' ) } />
					<Checklist progressBarText={ __( 'Your setup list' ) }>
						<Task
							title={ __( 'Set up membership' ) }
							description={ __(
								"Optimize your site for search engines and social media by taking advantage of our SEO tools. We'll walk you through important SEO strategies to get more exposure for your business."
							) }
							buttonText={ __( 'Do it' ) }
							active={ checklistProgress === 0 }
							completed={ checklistProgress > 0 }
							onClick={ () => this.performCheckListItem( 0 ) }
							onDismiss={ () => this.dismissCheckListItem( 0 ) }
						/>
						<Task
							title={ __( 'Set up your paywall' ) }
							description={ __(
								"Optimize your site for search engines and social media by taking advantage of our SEO tools. We'll walk you through important SEO strategies to get more exposure for your business."
							) }
							buttonText={ __( 'Do it' ) }
							active={ checklistProgress === 1 }
							completed={ checklistProgress > 1 }
							onClick={ () => this.performCheckListItem( 1 ) }
							onDismiss={ () => this.dismissCheckListItem( 1 ) }
						/>
						<Task
							title={ __( 'Customize your donations page' ) }
							description={ __(
								"Optimize your site for search engines and social media by taking advantage of our SEO tools. We'll walk you through important SEO strategies to get more exposure for your business."
							) }
							buttonText={ __( 'Do it' ) }
							active={ checklistProgress === 2 }
							completed={ checklistProgress > 2 }
							onClick={ () => this.performCheckListItem( 2 ) }
							onDismiss={ () => this.dismissCheckListItem( 2 ) }
						/>
						<Task
							title={ __( 'Set up call to action block' ) }
							description={ __(
								"Optimize your site for search engines and social media by taking advantage of our SEO tools. We'll walk you through important SEO strategies to get more exposure for your business."
							) }
							buttonText={ __( 'Do it' ) }
							active={ checklistProgress === 3 }
							completed={ checklistProgress > 3 }
							onClick={ () => this.performCheckListItem( 3 ) }
							onDismiss={ () => this.dismissCheckListItem( 3 ) }
						/>
					</Checklist>
					<Card>
						<FormattedHeader headerText={ __( 'Checkboxes' ) } />
						<CheckboxControl
							label={ __( 'Checkbox is tested?' ) }
							onChange={ function() {
								console.log( "Yep, it's tested" );
							} }
						/>
						<CheckboxControl
							label={ __( 'Checkbox w/Tooltip' ) }
							onChange={ function() {
								console.log( "Yep, it's tested" );
							} }
							tooltip="This is tooltip text"
						/>
						<CheckboxControl
							label={ __( 'Checkbox w/Help' ) }
							onChange={ function() {
								console.log( "Yep, it's tested" );
							} }
							help="This is help text"
						/>
					</Card>
					<Card>
						<FormattedHeader headerText={ __( 'Image Uploader' ) } />
						<ImageUpload
							image={ this.state.image }
							onChange={ image => {
								this.setState( { image } );
								console.log( 'Image:' );
								console.log( image );
							} }
						/>
					</Card>
					<Card>
						<FormattedHeader headerText={ __( 'Text Inputs' ) } />
						<TextControl
							label={ __( 'Text Input with value' ) }
							value={ inputTextValue1 }
							onChange={ value => this.setState( { inputTextValue1: value } ) }
						/>
						<TextControl
							label={ __( 'Text Input empty' ) }
							value={ inputTextValue2 }
							onChange={ value => this.setState( { inputTextValue2: value } ) }
						/>
						<TextControl
							type="number"
							label={ __( 'Number Input' ) }
							value={ inputNumValue }
							onChange={ value => this.setState( { inputNumValue: value } ) }
						/>
						<TextControl label={ __( 'Text Input disabled' ) } disabled />
					</Card>
					<Card>
						<FormattedHeader headerText={ __( 'Progress bar' ) } />
						<ProgressBar completed="2" total="3" />
						<ProgressBar completed="2" total="5" label={ __( 'Progress made' ) } />
						<ProgressBar completed="0" total="5" displayFraction />
						<ProgressBar completed="3" total="8" label={ __( 'Progress made' ) } displayFraction />
					</Card>
					<Card>
						<FormattedHeader headerText="Select dropdowns" />
						<SelectControl
							label={ __( 'Label for Select with a preselection' ) }
							value={ selectValue1 }
							options={ [
								{ value: '', label: __( '- Select -' ), disabled: true },
								{ value: '1st', label: __( 'First' ) },
								{ value: '2nd', label: __( 'Second' ) },
								{ value: '3rd', label: __( 'Third' ) },
							] }
							onChange={ value => this.setState( { selectValue1: value } ) }
						/>
						<SelectControl
							label={ __( 'Label for Select with no preselection' ) }
							value={ selectValue2 }
							options={ [
								{ value: '', label: __( '- Select -' ), disabled: true },
								{ value: '1st', label: __( 'First' ) },
								{ value: '2nd', label: __( 'Second' ) },
								{ value: '3rd', label: __( 'Third' ) },
							] }
							onChange={ value => this.setState( { selectValue2: value } ) }
						/>
						<SelectControl
							label={ __( 'Label for disabled Select' ) }
							disabled
							options={ [
								{ value: '', label: __( '- Select -' ), disabled: true },
								{ value: '1st', label: __( 'First' ) },
								{ value: '2nd', label: __( 'Second' ) },
								{ value: '3rd', label: __( 'Third' ) },
							] }
						/>
					</Card>
					<Card className="newspack-components-demo__buttons">
						<FormattedHeader headerText="Buttons" />
						<Card noBackground buttonsCard>
							<Button isPrimary>isPrimary</Button>
							<Button isDefault>isDefault</Button>
							<Button isTertiary>isTertiary</Button>
							<Button isLink>isLink</Button>
						</Card>
						<hr />
						<h2>isLarge</h2>
						<Card noBackground buttonsCard>
							<Button isPrimary isLarge>
								isPrimary
							</Button>
							<Button isDefault isLarge>
								isDefault
							</Button>
							<Button isTertiary isLarge>
								isTertiary
							</Button>
						</Card>
						<hr />
						<h2>isSmall</h2>
						<Card noBackground buttonsCard>
							<Button isPrimary isSmall>
								isPrimary
							</Button>
							<Button isDefault isSmall>
								isDefault
							</Button>
							<Button isTertiary isSmall>
								isTertiary
							</Button>
						</Card>
					</Card>
				</Grid>
			</Fragment>
		);
	}
}

render( <ComponentsDemo />, document.getElementById( 'newspack-components-demo' ) );
