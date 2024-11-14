import { Editor } from 'react-draft-wysiwyg';
import { EditorState, convertToRaw, ContentState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';

import { useState, useEffect } from '@wordpress/element';

import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

const getEditorStateFromHTML = ( html: string ) => {
	const contentBlock = htmlToDraft( html );
	if ( contentBlock ) {
		const contentState = ContentState.createFromBlockArray(
			contentBlock.contentBlocks
		);
		return EditorState.createWithContent( contentState );
	}
	return EditorState.createEmpty();
};

type Props = { value: string; onChange: ( newValue: string ) => void };

const RichTextEditor = ( { value, onChange }: Props ) => {
	const [ editorState, setEditorState ] = useState(
		EditorState.createEmpty()
	);
	useEffect( () => {
		setEditorState( getEditorStateFromHTML( value ) );
	}, [] );

	const htmlValue = draftToHtml(
		convertToRaw( editorState.getCurrentContent() )
	);

	useEffect( () => {
		onChange( htmlValue );
	}, [ htmlValue ] );

	return (
		// @ts-ignore
		<Editor
			toolbar={ {
				options: [ 'inline', 'link' ],
				inline: {
					options: [ 'bold', 'italic', 'underline' ],
				},
			} }
			editorState={ editorState }
			onEditorStateChange={ setEditorState }
		/>
	);
};

export default RichTextEditor;
