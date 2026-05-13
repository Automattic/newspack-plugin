/**
 * Rolling Content demo — shared status pill.
 *
 * Used by both the All Rolling Content view and the Manage Entries modal.
 * Generic over the status union so each caller passes its own labels and colors.
 */

type Palette = { bg: string; fg: string };

export default function StatusPill< S extends string >( {
	status,
	labels,
	colors,
}: {
	status: S;
	labels: Record< S, string >;
	colors: Record< S, Palette >;
} ) {
	const c = colors[ status ];
	return (
		<span
			style={ {
				background: c.bg,
				color: c.fg,
				padding: '2px 10px',
				borderRadius: 999,
				fontSize: 12,
				fontWeight: 500,
			} }
		>
			{ labels[ status ] }
		</span>
	);
}
