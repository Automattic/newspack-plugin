/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	ToggleControl,
	Button,
	SelectControl,
} from '@wordpress/components';
import { useEffect, useState, useRef, useCallback } from '@wordpress/element';
import { Icon, plus } from '@wordpress/icons';
import { addQueryArgs, removeQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { usePostAuthors } from './hooks';

/**
 * Parse byline meta to convert custom tags ([Author][/Author]) to token markup.
 *
 * @param {string} metaByline Value of byline as stored in meta key.
 * @return {string} Parsed byline with tokens for display in the editor.
 */
const parseForEdit = metaByline => {
	if (!metaByline) { return ''; }

	// Regex to convert [Author][/Author] tags to token markup
	return metaByline.replace(
		/\[Author id=(\d+)\](.*?)\[\/Author\]/g,
		(match, id, name) => {
			return `<span id="token-${id}" contenteditable="false" draggable="true" class="components-form-token-field__token token-inline-block author-token" data-token="${id}" data-name="${name}">
          <span class="components-form-token-field__token-text">${name}</span>
          <button
            class="components-button components-form-token-field__remove-token token-inline-block__remove"
            type="button"
            data-token="${id}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M13 11.8l6.1-6.3-1-1-6.1 6.2-6.1-6.2-1 1 6.1 6.3-6.5 6.7 1 1 6.5-6.6 6.5 6.6 1-1z" />
            </svg>
          </button>
        </span>`;
		}
	);
};

/**
 * Parse byline meta for preview display.
 *
 * @param {string}  metaByline          Value of byline as stored in meta key.
 * @param {boolean} showAvatar          Whether to show author avatars.
 * @param {number}  avatarSize          Size of author avatars.
 * @param {boolean} linkToAuthorArchive Whether to link to author archives.
 * @param {Array}   authors             List of authors to use for avatar and link generation.
 * @return {string} Parsed byline for preview display.
 */
const parseForPreview = (metaByline, showAvatar = false, avatarSize = 24, linkToAuthorArchive = true, authors, duotoneClassName = '') => {
	if (!metaByline) { return ''; }

	return metaByline.replace(
		/\[Author id=(\d*)\](.*?)\[\/Author\]/g,
		(match, id, name) => {
			let avatar = '';
			let authorLink = name;

			const matchedAuthor = authors.find(author => author.id === Number(id));
			const baseUrl = matchedAuthor?.avatar_urls?.['96'] || '';
			const avatarUrl = addQueryArgs(removeQueryArgs(baseUrl, ['s']), {
				s: avatarSize * 2,
			});

			if (showAvatar && avatarUrl && baseUrl) {
				avatar = `<span class="newspack-byline-avatar ${duotoneClassName}" style="display: inline-block; margin-right: 8px; vertical-align: middle;">
            <img 
              src="${avatarUrl}"
              alt="${name}" 
              class="avatar avatar-${avatarSize}" 
              width="${avatarSize}" 
              height="${avatarSize}" 
              style="border-radius: 50%;"
            />
          </span>`;
			}

			if (linkToAuthorArchive) {
				authorLink = `<a href="#" class="newspack-author-link">${name}</a>`;
			}

			return `<span class="newspack-byline-author" data-author-id="${id}">${avatar}${authorLink}</span>`;
		}
	);
};

/**
 * Transform the bylineElement innerHTML into the format that we expect to save.
 *
 * @param {Element} element Byline element reference.
 * @return {string} Updated byline text, transformed into the save format.
 */
const transformByline = element => {
	const clonebylineElement = element.cloneNode(true);

	// Remove avatar elements first (if any)
	const avatarElements = clonebylineElement.querySelectorAll('.avatar-display');
	avatarElements.forEach(el => el.remove());

	const tokenElements =
		clonebylineElement.querySelectorAll('span[data-token]');

	tokenElements.forEach(tokenElement => {
		const authorID = tokenElement.dataset.token;
		const authorName = tokenElement.dataset.name ||
			(tokenElement.querySelector('.components-form-token-field__token-text')?.innerText || '').trim();

		if (authorID && authorName) {
			tokenElement.replaceWith(
				document.createTextNode(
					`[Author id=${authorID}]${authorName}[/Author]`
				)
			);
		}
	});

	return clonebylineElement.innerHTML;
};

const Edit = ({ attributes, context, setAttributes, isSelected }) => {
	const { postId, postType } = context;
	const { customByline, showAvatar, avatarSize, linkToAuthorArchive } = attributes;
	const [authors, setAuthors] = useState([]);
	const [tokensInUse, setTokensInUse] = useState([]);

	// Refs to manage states
	const editableRef = useRef(null);
	const contentRef = useRef(customByline || '');
	const isTypingRef = useRef(false);
	const typingTimeoutRef = useRef(null);
	const savingTimeoutRef = useRef(null);

	const blockProps = useBlockProps({
		className: 'newspack-byline-block',
		__unstableLayoutClassNames: []
	});

	const duotoneClassName = blockProps.className
		? blockProps.className.split(' ')
			.filter((classes) => classes.includes('wp-duotone'))
			.join(' ')
		: '';

	const postAuthors = usePostAuthors({ postId, postType });

	useEffect(() => {
		if (postAuthors?.length) {
			setAuthors(postAuthors);
		}
	}, [postAuthors]);

	// Set default byline if none exists (initialize byline)
	useEffect(() => {
		if ((!customByline || customByline === '') && authors.length > 0) {
			let defaultByline = 'Published by: ';

			authors.forEach((author, index) => {
				if (index > 0) {
					defaultByline += (index === authors.length - 1) ? ' and ' : ', ';
				}
				defaultByline += `[Author id=${author.id}]${author.display_name}[/Author]`;
			});

			setAttributes({ customByline: defaultByline });
		}
	}, [authors, customByline, setAttributes]);

	// Update avatar when duotone changes
	useEffect(() => {
		if (editableRef.current && showAvatar) {
			const selectionData = saveSelection();
			updateAvatarDisplay();
			if (selectionData) {
				restoreSelection(selectionData);
			}
		}
	}, [duotoneClassName]);

	// Save cursor position
	const saveSelection = () => {
		const selection = editableRef.current?.ownerDocument.defaultView.getSelection();
		if (!selection.rangeCount) { return null; }

		return {
			range: selection.getRangeAt(0).cloneRange(),
			startContainer: selection.anchorNode,
			startOffset: selection.anchorOffset,
			endContainer: selection.focusNode,
			endOffset: selection.focusOffset
		};
	};

	// Restore cursor position
	const restoreSelection = (selectionData) => {
		if (!selectionData || !selectionData.range) { return; }

		try {
			const selection = editableRef.current?.ownerDocument.defaultView.getSelection();
			selection.removeAllRanges();
			selection.addRange(selectionData.range);
		} catch (e) {
			// Error occurred while restoring selection
		}
	};

	// Update tokens in use
	const updateTokensInUse = (element) => {
		if (!element) { return; }

		const tokenElements = element.querySelectorAll('span[data-token]');
		const inUse = [...tokenElements].map(span => Number(span.dataset.token));
		setTokensInUse(inUse);
	};
	// Update avatar displays in edit mode
	const updateAvatarDisplay = () => {
		if (!editableRef.current) {
			return;
		}

		// First, remove any existing avatar displays
		const existingAvatars = editableRef.current.querySelectorAll('.avatar-display');
		existingAvatars.forEach(el => el.remove());

		if (!showAvatar) {
			return;
		}

		const authorTokens = editableRef.current.querySelectorAll('.author-token');

		authorTokens.forEach(token => {
			const authorId = token.dataset.token;
			const authorName = token.dataset.name;
			const matchedAuthor = authors.find(author => author.id === Number(authorId));

			if (matchedAuthor) {
				const baseUrl = matchedAuthor?.avatar_urls?.['96'] || '';
				const avatarUrl = addQueryArgs(removeQueryArgs(baseUrl, ['s']), {
					s: avatarSize * 2,
				});

				if (avatarUrl) {
					const avatarEl = document.createElement('span');
					avatarEl.className = `newspack-byline-avatar avatar-display avatar-display-${authorId}`;

					// Apply duotone classes from blockProps
					if (duotoneClassName) {
						avatarEl.className += ` ${duotoneClassName}`;
					}

					avatarEl.style.cssText = `
					display: inline-block;
					margin-right: 4px;
					vertical-align: middle;
					position: relative;
					z-index: 0;
					`;

					avatarEl.innerHTML = `
					<img 
						src="${avatarUrl}"
						alt="${authorName}" 
						class="avatar avatar-${avatarSize}" 
						width="${avatarSize}" 
						height="${avatarSize}" 
						style="border-radius: 50%;"
					/>
            		`;

					// Insert avatar before the token
					token.parentNode.insertBefore(avatarEl, token);
				}
			}
		});
	};

	// Initialize contenteditable and set up event handlers
	const setupContentEditable = useCallback(element => {
		if (!element || !authors.length) {
			return;
		}
		editableRef.current = element;

		// If contenteditable is empty or has changed, initialize it
		if (element.innerHTML !== parseForEdit(contentRef.current)) {
			element.innerHTML = parseForEdit(contentRef.current);
		}

		const handleInput = () => {
			// Mark as typing to prevent focus loss
			isTypingRef.current = true;

			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}

			// Set timeout to detect when typing stops
			typingTimeoutRef.current = setTimeout(() => {
				isTypingRef.current = false;
			}, 2000);

			// Save changes with debounce
			if (savingTimeoutRef.current) {
				clearTimeout(savingTimeoutRef.current);
			}

			savingTimeoutRef.current = setTimeout(() => {
				const selectionData = saveSelection();

				// Remove avatar displays - they shouldn't be saved
				const avatarElements = element.querySelectorAll('.avatar-display');
				avatarElements.forEach(el => el.remove());

				// Update content ref
				const transformedContent = transformByline(element);
				contentRef.current = transformedContent;

				// Update tokens in use
				updateTokensInUse(element);

				// Add back avatars if needed
				if (showAvatar) {
					updateAvatarDisplay();
				}

				// Update attributes (delayed to maintain focus)
				setTimeout(() => {
					setAttributes({ customByline: transformedContent });

					// Make sure we keep focus and restore cursor
					if (editableRef.current && editableRef.current.ownerDocument.activeElement !== editableRef.current) {
						editableRef.current.focus();
					}

					// Restore selection
					if (selectionData) {
						restoreSelection(selectionData);
					}
				}, 10);
			}, 1000);
		};

		// Click handler for token removal
		const handleClick = (e) => {
			if (e.target.classList.contains('token-inline-block__remove')) {
				const tokenElement = e.target.closest('.token-inline-block');
				if (tokenElement) {
					// Remove associated avatar if present
					const authorId = tokenElement.dataset.token;
					const avatarEl = element.querySelector(`.avatar-display-${authorId}`);
					if (avatarEl) {
						avatarEl.remove();
					}
					tokenElement.remove();
					handleInput();
				}
			}
		};

		// Add event listeners
		element.addEventListener('input', handleInput);
		element.addEventListener('click', handleClick);

		// Set initial tokens
		updateTokensInUse(element);

		// Initialize avatars if needed
		if (showAvatar) {
			updateAvatarDisplay();
		}

		return () => {
			// Cleanup event listeners
			element.removeEventListener('input', handleInput);
			element.removeEventListener('click', handleClick);

			// Clear timeouts
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}
			if (savingTimeoutRef.current) {
				clearTimeout(savingTimeoutRef.current);
			}
		};
	}, [setAttributes, showAvatar, avatarSize, authors, duotoneClassName]);

	// Function to insert token
	const insertToken = (token) => {
		const element = editableRef.current;
		if (!element) {
			return;
		}

		// Save selection
		const selection = editableRef.current?.ownerDocument.defaultView.getSelection();
		let range;

		if (selection.rangeCount > 0) {
			range = selection.getRangeAt(0);
		} else {
			// Create a range at the end if none exists
			range = document.createRange();
			const lastChild = element.lastChild;
			if (lastChild) {
				range.setStartAfter(lastChild);
			} else {
				range.setStart(element, 0);
			}
			range.collapse(true);
		}

		// Delete any selected content
		range.deleteContents();

		// Create token element
		const tokenElement = document.createElement('span');
		tokenElement.id = `token-${token.id}`;
		tokenElement.contentEditable = false;
		tokenElement.draggable = true;
		tokenElement.className = 'components-form-token-field__token token-inline-block author-token';
		tokenElement.dataset.token = token.id;
		tokenElement.dataset.name = token.display_name;
		tokenElement.innerHTML = `
        <span class="components-form-token-field__token-text">${token.display_name}</span>
        <button
          class="components-button components-form-token-field__remove-token token-inline-block__remove"
          type="button"
          data-token="${token.id}"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M13 11.8l6.1-6.3-1-1-6.1 6.2-6.1-6.2-1 1 6.1 6.3-6.5 6.7 1 1 6.5-6.6 6.5 6.6 1-1z" />
          </svg>
        </button>
      `;

		// Insert token
		range.insertNode(tokenElement);

		// Add avatar if enabled
		if (showAvatar && token) {
			const baseUrl = token?.avatar_urls?.['96'] || '';
			const avatarUrl = addQueryArgs(removeQueryArgs(baseUrl, ['s']), {
				s: avatarSize * 2,
			});

			if (avatarUrl) {
				const avatarEl = document.createElement('span');
				avatarEl.className = `newspack-byline-avatar avatar-display avatar-display-${token.id}`;

				// Apply duotone classes from blockProps
				if (duotoneClassName) {
					avatarEl.className += ` ${duotoneClassName}`;
				}

				avatarEl.style.cssText = `
					display: inline-block;
					margin-right: 4px;
					vertical-align: middle;
					position: relative;
					z-index: 0;
				`;

				avatarEl.innerHTML = `
					<img 
					src="${avatarUrl}"
					alt="${token.display_name}" 
					class="avatar avatar-${avatarSize}" 
					width="${avatarSize}" 
					height="${avatarSize}" 
					style="border-radius: 50%;"
					/>
				`;

				// Insert avatar before the token
				tokenElement.parentNode.insertBefore(avatarEl, tokenElement);
			}
		}

		// Add space after token
		const spaceNode = document.createTextNode(' ');
		tokenElement.parentNode.insertBefore(spaceNode, tokenElement.nextSibling);

		// Move cursor after the space
		const newRange = document.createRange();
		newRange.setStart(spaceNode, 1);
		newRange.setEnd(spaceNode, 1);
		selection.removeAllRanges();
		selection.addRange(newRange);

		element.focus();

		// Update content
		const transformedContent = transformByline(element);
		contentRef.current = transformedContent;
		updateTokensInUse(element);

		// Update attributes
		setAttributes({ customByline: transformedContent });
	};

	// Update content ref when block attributes change
	useEffect(() => {
		contentRef.current = customByline || '';

		// Update editable content if we have a reference and content changed
		if (editableRef.current && parseForEdit(customByline) !== editableRef.current.innerHTML) {
			// Only update if not currently typing to avoid cursor jumps
			if (!isTypingRef.current) {
				editableRef.current.innerHTML = parseForEdit(customByline);
				updateTokensInUse(editableRef.current);

				// Update avatar display if needed
				if (showAvatar) {
					updateAvatarDisplay();
				}
			}
		}
	}, [customByline]);

	// Effect to update avatar display when avatar settings change
	useEffect(() => {
		if (editableRef.current) {
			const selectionData = saveSelection();

			// Remove all existing avatars
			const existingAvatars = editableRef.current.querySelectorAll('.avatar-display');
			existingAvatars.forEach(el => el.remove());

			// Add new avatars if needed
			if (showAvatar) {
				updateAvatarDisplay();
			}

			// Restore selection
			if (selectionData) {
				restoreSelection(selectionData);
			}
		}
	}, [showAvatar, avatarSize]);

	// Focus handler
	useEffect(() => {
		if (isSelected && editableRef.current) {
			// Focus the element and move cursor to end if not already focused
			if (editableRef.current.ownerDocument.activeElement !== editableRef.current) {
				editableRef.current.focus();

				// Move cursor to end
				const selection = editableRef.current?.ownerDocument.defaultView.getSelection();
				const range = document.createRange();

				if (editableRef.current.lastChild) {
					if (editableRef.current.lastChild.nodeType === Node.TEXT_NODE) {
						range.setStart(editableRef.current.lastChild, editableRef.current.lastChild.length);
					} else {
						range.setStartAfter(editableRef.current.lastChild);
					}
				} else {
					range.setStart(editableRef.current, 0);
				}

				range.collapse(true);
				selection.removeAllRanges();
				selection.addRange(range);
			}
		}
	}, [isSelected]);

	// Update available authors
	const availableAuthors = authors.filter(author => !tokensInUse.includes(author.id));


	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Byline Settings', 'newspack-plugin')}>
					<ToggleControl
						label={__('Show author avatars', 'newspack-plugin')}
						checked={showAvatar}
						onChange={() => setAttributes({ showAvatar: !showAvatar })}
					/>
					{showAvatar && (
						<SelectControl
							label={__('Avatar size', 'newspack-plugin')}
							value={avatarSize}
							options={[
								{ label: '16 x 16', value: 16 },
								{ label: '24 x 24', value: 24 },
								{ label: '32 x 32', value: 32 },
								{ label: '48 x 48', value: 48 },
							]}
							onChange={(value) => setAttributes({ avatarSize: Number(value) })}
						/>
					)}
					<ToggleControl
						label={__('Link to author archives', 'newspack-plugin')}
						checked={linkToAuthorArchive}
						onChange={() => setAttributes({ linkToAuthorArchive: !linkToAuthorArchive })}
					/>
				</PanelBody>
			</InspectorControls>
			{isSelected ? (
				<>
					{customByline ? (
						<>
							<div
								className="newspack-byline-textarea"
								contentEditable
								ref={setupContentEditable}
								suppressContentEditableWarning
								onFocus={() => isTypingRef.current = true}
								onBlur={() => {
									setTimeout(() => {
										isTypingRef.current = false;
									}, 100);
								}}
							/>
							{availableAuthors.length > 0 && (
								<div className="newspack-author-selector">
									<div className="newspack-author-selector-label">
										{__('Add author:', 'newspack-plugin')}
									</div>
									<div className="newspack-author-tokens">
										{availableAuthors.map((author) => (
											<Button
												key={author.id}
												variant="secondary"
												isSmall
												onClick={() => insertToken(author)}
												className="author-token-button"
												style={{ marginRight: '8px', marginBottom: '8px' }}
											>
												<span>{author.display_name}</span>
												<Icon icon={plus} size={16} style={{ marginLeft: '4px' }} />
											</Button>
										))}
									</div>
								</div>
							)}
						</>
					) : (
						<div
							className="newspack-byline-textarea"
							style={{ minHeight: '36px', padding: '4px 0', color: '#aaa' }}
						>
							{__('Loading byline…', 'newspack-plugin')}
						</div>
					)}
				</>
			) : (
				<div
					className="newspack-byline-preview"
					dangerouslySetInnerHTML={{ __html: parseForPreview(customByline, showAvatar, avatarSize, linkToAuthorArchive, authors, duotoneClassName) }}
				/>
			)}
		</>
	);
};

export default Edit;
