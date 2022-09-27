(function ($) {
	if (typeof wp.revisions.view.MetaTo != 'undefined') {
		var MetaTo = wp.revisions.view.MetaTo,
			old_render = MetaTo.prototype.render;

		MetaTo.prototype.updateRevisionRelevance = function (significant) {
			this.model.attributes.to.attributes.newspack_significant = significant;
			this.updateRelevanceButton();
		}
		MetaTo.prototype.updateRelevanceButton = function () {
			var button = document.createElement('input');
			button.type = 'button';
			console.log('asd');
			console.log(this.model.attributes.to.attributes.newspack_significant);
			button.value = this.model.attributes.to.attributes.newspack_significant ? 'Unmark as significant' : 'Mark as significant';
			var t = this;
			var revision_id = this.model.attributes.to.attributes.id;
			var post_id = this.model.attributes.postId;
			button.onclick = () => {
				toggleRevisionSignificant(post_id, revision_id, function (data) {
					var response = jQuery.parseJSON(data);
					t.updateRevisionRelevance(response.significant);
				});
			};
			button.className = 'mark-significant button button-secondary';
			this.$el.find('.mark-significant').remove();
			this.$el.append(button);
		}
		MetaTo.prototype.render = function () {
			// Have the original renderer run first.
			old_render.apply(this, arguments);

			console.log(this.model);
			this.updateRelevanceButton(); //$el.append( getButton() );

		};

		function toggleRevisionSignificant(post_id, id, callback) {
			$.post(
				newspack_revisions_control.ajax_url,
				{
					action: 'newspack_toggle_revision_significant',
					revision_id: id,
					post_id: post_id,
					_ajax_nonce: newspack_revisions_control.mark_significant_nonce,
				},
				callback
			);
		}
	}
})(jQuery);
