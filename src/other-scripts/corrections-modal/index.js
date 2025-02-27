/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import {
	BaseControl,
	Button,
	Modal,
	PanelBody,
	Popover,
	SelectControl,
	TextareaControl,
	DateTimePicker,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies.
 */
import './style.scss';
import moment from 'moment';

/**
 * Correction types.
 *
 * @type {Object[]} The correction types.
 */
const types = [
	{ label: __( 'Correction', 'newspack-plugin' ), value: 'correction' },
	{ label: __( 'Clarification', 'newspack-plugin' ), value: 'clarification' },
];

/**
 * Save the corrections data.
 *
 * @param {number} postId  The post ID.
 * @param {Object} payload The corrections data.
 *
 * @return {Promise} The response.
 */
const saveData = async ( postId, payload ) => {
	const response = await apiFetch( {
		path: `${window.NewspackCorrectionsData.restPath}/${postId}`,
		method: 'POST',
		data: payload,
	} );
	return response;
};

/**
 * The corrections modal component.
 *
 * @return {JSX.Element} The corrections modal component.
 */
const CorrectionsModal = () => {
	/**
	 * Get the current post ID.
	 */
	const postId = useSelect( ( select ) => select( 'core/editor' ).getCurrentPostId(), [] );

	/**
	 * Define the state variables.
	 */
	const [ isOpen, setIsOpen ] = useState( false );
	const [ isSaving, setIsSaving ] = useState(false);
	const [ saveError, setSaveError ] = useState(null);
	const [ corrections, setCorrections ] = useState( [] );
	const [ newCorrection, setNewCorrection ] = useState( '' );
	const [ newCorrectionType, setNewCorrectionType ] = useState( 'correction' );
	const [ isDatePopoverOpen, setIsDatePopoverOpen ] = useState( null );

	// Fetch corrections when modal opens
	useEffect( () => {
		if ( window.NewspackCorrectionsData.corrections ) {
			setCorrections(
				window.NewspackCorrectionsData.corrections.map( ( correction ) => ( {
					...correction,
					type: correction.correction_type || 'correction',
					date: correction.correction_date,
				} ) )
			);
		}
	}, [] );

	// Send Corrections.
	useEffect( () => {
		if ( isSaving ) {
			saveCorrections();
		}
	}, [ isSaving ]);

	// Add a new correction to the list.
	const saveCorrection = () => {
		// Check if the correction is empty.
		if ( ! newCorrection ) {
			return;
		}

		// Add date as per site's timezone.
		const adjustedDate  = new Date().toLocaleString(
			'en-US',
			{
				timeZone: window.NewspackCorrectionsData.siteTimezone,
				hour12: false
			}
		);

		setCorrections(
			[
				{
					ID: Date.now(),
					post_content: newCorrection,
					type: newCorrectionType,
					date: adjustedDate,
					isNew: true
				},
				...corrections
			]
		);
		setNewCorrection( '' );
		setNewCorrectionType( 'correction' );
	};

	// Update an existing correction.
	const updateCorrection = ( correctionId, postContent, type, date ) => {
		setCorrections( corrections.map( ( correction ) => {
			if ( correction.ID === correctionId ) {
				return { ...correction, post_content: postContent, type, date };
			}
			return correction;
		} ) );
	};

	// Delete a correction.
	const deleteCorrection = ( correctionId ) => {
		setCorrections( corrections.filter( ( correction ) => correction.ID !== correctionId ) );
	};

	// Save all corrections.
	const saveCorrections = async () => {
		setSaveError( null );

		const payload = {
			post_id: postId,
			corrections: corrections.map( ( { ID, post_content, type, date, isNew } ) => ({
				id: isNew ? null : ID, // Null means create a new correction
				content: post_content,
				type,
				date: moment( new Date( date ) ).format( 'YYYY-MM-DD HH:mm:ss' ),
			} ) ),
		};

		try {
			await saveData( postId, payload );
			setIsOpen(false);
		} catch ( error ) {
			setSaveError( error.message );
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<>
			<PluginDocumentSettingPanel
				name="newspack-corrections-panel"
				title= { __( 'Corrections & Clarifications', 'newspack-plugin' ) }
				className="newspack-corrections-panel"
			>
				<Button
					variant="secondary"
					onClick={ () => setIsOpen( true ) }
					label={ __( 'Manage corrections and clarifications', 'newspack-plugin' ) }
					__next40pxDefaultSize
				>
					{ __( 'Manage corrections', 'newspack-plugin' ) }
				</Button>
			</PluginDocumentSettingPanel>

			{ isOpen && (
				<Modal
					title={ __( 'Corrections & Clarifications', 'newspack-plugin' ) }
					onRequestClose={ () => setIsOpen( false ) }
					className="newspack-corrections-modal"
					size="medium"
				>
					{ corrections.length > 0 ? (
						<PanelBody
							title={ __( 'Corrections log', 'newspack-plugin' ) }
							initialOpen={ true }
							className="correction-panel"
						>
							{ corrections.map( ( correction ) => (
									<div key={correction.ID} className="correction-item">
										<div>
											<SelectControl
												label={ __( 'Type', 'newspack-plugin' ) }
												value={ correction.type }
												options={ types }
												onChange={ ( value ) => updateCorrection( correction.ID, correction.post_content, value, correction.date ) }
												__next40pxDefaultSize
											/>
											<BaseControl
												id={ `correction-date-${correction.ID}` }
												label={ __( 'Date', 'newspack-plugin' ) }
											>
												<Button
													variant="secondary"
													className="correction-date-button"
													onClick={ () => setIsDatePopoverOpen( correction.ID ) }
													icon={ calendar}
													iconPosition="right"
													__next40pxDefaultSize
												>
													{ new Date( correction.date ).toLocaleString() }
												</Button>
											</BaseControl>
											{ isDatePopoverOpen === correction.ID && (
												<Popover
													className="correction-date-popover"
													position="bottom center"
													onClose={ () => setIsDatePopoverOpen( null ) }
												>
													<DateTimePicker
														label={ __( 'Date', 'newspack-plugin' ) }
														className='correction-date'
														is12Hour={ true }
														currentDate={ new Date( correction.date ) }
														onChange={ ( value ) => updateCorrection( correction.ID, correction.post_content, correction.type, value ) }
													/>
												</Popover>
											) }
										</div>
										<TextareaControl
											label={ __( 'Description', 'newspack-plugin' ) }
											rows={ 3 }
											value={ correction.post_content }
											onChange={ ( value ) => updateCorrection( correction.ID, value, correction.type, correction.date ) }
										/>
										<Button
											text={ __( 'Delete', 'newspack-plugin' ) }
											variant="secondary"
											onClick={ () => deleteCorrection( correction.ID ) }
											isDestructive
										/>
									</div>
								) )
							}
						</PanelBody>
					) : null }

					{ ! isSaving && (
						<PanelBody
							title={ __( 'Add new correction', 'newspack-plugin' ) }
							initialOpen={ false }
							className="correction-panel"
						>
							<div className="correction-item">
								<SelectControl
									label={ __( 'Type', 'newspack-plugin' ) }
									value={ newCorrectionType }
									options={ types }
									onChange={ ( value ) => setNewCorrectionType( value ) }
									__next40pxDefaultSize
								/>
								<TextareaControl
									label={ __( 'Description', 'newspack-plugin' ) }
									rows={ 3 }
									value={ newCorrection }
									onChange={ ( value ) => setNewCorrection( value ) }
								/>
								<Button
									text={ __( 'Add', 'newspack-plugin' ) }
									variant="secondary"
									onClick={ saveCorrection }
									disabled={ ! newCorrection }
								/>
							</div>
						</PanelBody>
					) }

					{ saveError && <p className="error-message">{ saveError }</p> }

					<div className="correction-actions">
						<Button
							variant="primary"
							onClick={ () => {
								saveCorrection();
								setIsSaving( true );
							} }
							isBusy={ isSaving }
						>
							{ isSaving ? __( 'Saving…', 'newspack-plugin' ) : __( 'Close & save', 'newspack-plugin' ) }
						</Button>
						<Button
							variant="tertiary"
							onClick={ () => {
								setIsOpen( false )
							} }
						>
							{ __( 'Cancel', 'newspack-plugin' ) }
						</Button>
					</div>
				</Modal>
			) }
		</>
	);
};

registerPlugin( 'newspack-corrections', {
	render: CorrectionsModal,
	icon: null,
} );
