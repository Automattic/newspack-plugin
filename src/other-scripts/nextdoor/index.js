/**
 * Nextdoor post editor Plugin
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { Button, Spinner, Notice, Panel, PanelBody, PanelHeader, Flex, FlexItem, SVG } from '@wordpress/components';
import { PluginSidebar } from '@wordpress/editor';
import { registerPlugin } from '@wordpress/plugins';
import { dateI18n, getSettings } from '@wordpress/date';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * Component for Nextdoor publishing controls in the post editor sidebar.
 */
const NextdoorPostSidebar = ( { postId, postStatus } ) => {
	const [ isLoading, setIsLoading ] = useState( true );
	const [ isPublishing, setIsPublishing ] = useState( false );
	const [ isUpdating, setIsUpdating ] = useState( false );
	const [ isDeleting, setIsDeleting ] = useState( false );
	const [ nextdoorStatus, setNextdoorStatus ] = useState( null );
	const [ error, setError ] = useState( null );
	const [ success, setSuccess ] = useState( null );

	/**
	 * Fetch Nextdoor status for the current post
	 */
	const fetchStatus = async () => {
		try {
			setIsLoading( true );
			setError( null );

			const response = await apiFetch( {
				path: `/newspack/v1/nextdoor/post-status/${ postId }`,
			} );

			setNextdoorStatus( response );
		} catch ( fetchError ) {
			setError( fetchError.message || __( 'Failed to load Nextdoor status.', 'newspack-plugin' ) );
		} finally {
			setIsLoading( false );
		}
	};

	/**
	 * Clear messages after a delay
	 */
	const clearMessages = () => {
		setTimeout( () => {
			setError( null );
			setSuccess( null );
		}, 5000 );
	};

	/**
	 * Handle publishing post to Nextdoor
	 */
	const handlePublish = async () => {
		try {
			setIsPublishing( true );
			setError( null );
			setSuccess( null );

			const response = await apiFetch( {
				path: `/newspack/v1/nextdoor/publish-post/${ postId }`,
				method: 'POST',
			} );

			if ( response.success ) {
				setSuccess( response.message );
				await fetchStatus(); // Refresh status
			} else {
				setError( response.message || __( 'Failed to publish to Nextdoor.', 'newspack-plugin' ) );
			}
		} catch ( publishError ) {
			setError( publishError.message || __( 'Failed to publish to Nextdoor.', 'newspack-plugin' ) );
		} finally {
			setIsPublishing( false );
			clearMessages();
		}
	};

	/**
	 * Handle updating post on Nextdoor
	 */
	const handleUpdate = async () => {
		try {
			setIsUpdating( true );
			setError( null );
			setSuccess( null );

			const response = await apiFetch( {
				path: `/newspack/v1/nextdoor/update-post/${ postId }`,
				method: 'PUT',
			} );

			if ( response.success ) {
				setSuccess( response.message );
				await fetchStatus(); // Refresh status
			} else {
				setError( response.message || __( 'Failed to update on Nextdoor.', 'newspack-plugin' ) );
			}
		} catch ( updateError ) {
			setError( updateError.message || __( 'Failed to update on Nextdoor.', 'newspack-plugin' ) );
		} finally {
			setIsUpdating( false );
			clearMessages();
		}
	};

	/**
	 * Handle deleting post from Nextdoor
	 */
	const handleDelete = async () => {
		try {
			setIsDeleting( true );
			setError( null );
			setSuccess( null );

			const response = await apiFetch( {
				path: `/newspack/v1/nextdoor/delete-post/${ postId }`,
				method: 'DELETE',
			} );

			if ( response.success ) {
				setSuccess( response.message );
				await fetchStatus(); // Refresh status
			} else {
				setError( response.message || __( 'Failed to remove from Nextdoor.', 'newspack-plugin' ) );
			}
		} catch ( deleteError ) {
			setError( deleteError.message || __( 'Failed to remove from Nextdoor.', 'newspack-plugin' ) );
		} finally {
			setIsDeleting( false );
			clearMessages();
		}
	};

	/**
	 * Format date for display
	 */
	const formatDate = dateString => {
		if ( ! dateString ) {
			return '';
		}
		const dateFormat = getSettings().formats.datetimeAbbreviated || 'Y-m-d g:i a';
		return dateI18n( dateFormat, dateString );
	};

	// Load status on mount and when post ID changes
	useEffect( () => {
		if ( postId ) {
			fetchStatus();
		}
	}, [ postId ] );

	/**
	 * Render the main content
	 */
	const renderContent = () => {
		if ( isLoading ) {
			return (
				<Flex justify="center" className="nextdoor-sidebar__loading">
					<FlexItem>
						<Spinner />
					</FlexItem>
					<FlexItem>
						<p>{ __( 'Loading Nextdoor status…', 'newspack-plugin' ) }</p>
					</FlexItem>
				</Flex>
			);
		}

		if ( ! nextdoorStatus?.can_publish ) {
			return (
				<Notice status="warning" isDismissible={ false }>
					{ __( 'Nextdoor is not connected or you do not have permission to publish to Nextdoor.', 'newspack-plugin' ) }
				</Notice>
			);
		}

		if ( postStatus !== 'publish' ) {
			return (
				<Notice status="info" isDismissible={ false }>
					{ __( 'Post must be published before sharing to Nextdoor.', 'newspack-plugin' ) }
				</Notice>
			);
		}

		// Check for deleted posts first
		if ( nextdoorStatus?.is_deleted ) {
			return (
				<>
					<Panel>
						<PanelHeader>{ __( 'Removed from Nextdoor', 'newspack-plugin' ) }</PanelHeader>
						<PanelBody>
							<Notice status="warning" isDismissible={ false }>
								{ __(
									`This post was previously removed from Nextdoor and cannot be republished due to platform limitations.`,
									'newspack-plugin'
								) }
							</Notice>
							{ nextdoorStatus.deleted_at && (
								<p className="nextdoor-sidebar__status-text nextdoor-sidebar__status-text--default">
									<strong>{ __( 'Removed:', 'newspack-plugin' ) }</strong> { formatDate( nextdoorStatus.deleted_at ) }
								</p>
							) }
						</PanelBody>
					</Panel>
				</>
			);
		}

		return (
			<>
				{ error && (
					<Notice status="error" isDismissible={ false }>
						{ error }
					</Notice>
				) }

				{ success && (
					<Notice status="success" isDismissible={ false }>
						{ success }
					</Notice>
				) }

				{ nextdoorStatus?.is_shared ? (
					<Panel>
						<PanelHeader>{ __( 'Shared to Nextdoor', 'newspack-plugin' ) }</PanelHeader>
						<PanelBody>
							<p className="nextdoor-sidebar__status-text">
								{ __( 'This post is available in your Nextdoor community.', 'newspack-plugin' ) }
							</p>

							{ nextdoorStatus.shared_at && (
								<p className="nextdoor-sidebar__status-text nextdoor-sidebar__status-text--default">
									<strong>{ __( 'Shared:', 'newspack-plugin' ) }</strong> { formatDate( nextdoorStatus.shared_at ) }
								</p>
							) }

							{ nextdoorStatus.updated_at && (
								<p className="nextdoor-sidebar__status-text nextdoor-sidebar__status-text--default">
									<strong>{ __( 'Updated:', 'newspack-plugin' ) }</strong> { formatDate( nextdoorStatus.updated_at ) }
								</p>
							) }

							{ nextdoorStatus.needs_update && (
								<Notice status="info" isDismissible={ false } className="nextdoor-sidebar__notice">
									{ __( 'This post has been modified since it was last updated on Nextdoor.', 'newspack-plugin' ) }
								</Notice>
							) }

							<div className="nextdoor-sidebar__actions">
								<Button
									variant="primary"
									onClick={ handleUpdate }
									isBusy={ isUpdating }
									disabled={ isUpdating || isDeleting }
									size="small"
								>
									{ isUpdating ? __( 'Updating…', 'newspack-plugin' ) : __( 'Update', 'newspack-plugin' ) }
								</Button>
								<Button
									variant="secondary"
									isDestructive
									onClick={ handleDelete }
									isBusy={ isDeleting }
									disabled={ isUpdating || isDeleting }
									size="small"
								>
									{ isDeleting ? __( 'Removing…', 'newspack-plugin' ) : __( 'Remove', 'newspack-plugin' ) }
								</Button>
							</div>
						</PanelBody>
					</Panel>
				) : (
					<Panel>
						<PanelBody>
							<p className="nextdoor-sidebar__description">
								{ __( 'Share this post to your Nextdoor community to engage local readers.', 'newspack-plugin' ) }
							</p>
							<Button variant="primary" onClick={ handlePublish } isBusy={ isPublishing } disabled={ isPublishing }>
								{ isPublishing ? __( 'Publishing…', 'newspack-plugin' ) : __( 'Publish on Nextdoor', 'newspack-plugin' ) }
							</Button>
						</PanelBody>
					</Panel>
				) }
			</>
		);
	};

	return (
		<PluginSidebar name="nextdoor-publish" title={ __( 'Nextdoor', 'newspack-plugin' ) } icon={ nextdoorIcon } className="nextdoor-post-plugin">
			{ renderContent() }
		</PluginSidebar>
	);
};

const nextdoorIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" viewBox="0 0 24 24" id="nextdoor">
		<polygon points="19.879 21.5 19.879 11.703 22.039 13.014 24 9.821 12.001 2.5 7.88 5.017 7.88 2.5 4.122 2.5 4.122 7.305 0 9.821 1.962 13.014 4.123 11.703 4.123 21.5" />
	</SVG>
);

const NextdoorPostSidebarPlugin = compose( [
	withSelect( select => {
		const { getCurrentPostId, getCurrentPostAttribute } = select( 'core/editor' );
		return {
			postId: getCurrentPostId(),
			postStatus: getCurrentPostAttribute( 'status' ),
		};
	} ),
] )( NextdoorPostSidebar );

// Register the plugin
registerPlugin( 'newspack-nextdoor-post-plugin', {
	render: NextdoorPostSidebarPlugin,
	icon: nextdoorIcon,
} );

export default NextdoorPostSidebarPlugin;
