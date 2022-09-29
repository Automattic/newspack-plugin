(function ($) {
	if (typeof wp.revisions.view.MetaTo != 'undefined') {
		var MetaTo = wp.revisions.view.MetaTo,
			old_render = MetaTo.prototype.render;

		/**
		 * Callback after ajax request
		 */
		MetaTo.prototype.updateRevisionSignificant = function (significant) {
			this.model.attributes.to.attributes.newspack_significant = significant;
			this.updateToggleSignificantButton();
		}

		/**
		 * Handles the creation of the button to toggle revivision significance
		 */
		MetaTo.prototype.updateToggleSignificantButton = function () {
			var labels = newspack_revisions_control.labels;

			var button = this.$el.find('.mark-significant');
			button.prop('value', this.model.attributes.to.attributes.newspack_significant ? labels.unmark : labels.mark);

		}

		/**
		 * Gets the Message element
		 */
		MetaTo.prototype.getMessageSpan = function () {
			return this.$el.find('.mark-significant-message');
		}

		/**
		 * Overrides the original render method
		 */
		MetaTo.prototype.render = function () {
			// Have the original renderer run first.
			old_render.apply(this, arguments);

			var labels = newspack_revisions_control.labels;

			// Add button
			var button = document.createElement('input');
			button.type = 'button';
			button.value = this.model.attributes.to.attributes.newspack_significant ? labels.unmark : labels.mark;
			button.className = 'mark-significant button button-secondary';

			var t = this;
			var revision_id = this.model.attributes.to.attributes.id;
			var post_id = this.model.attributes.postId;

			button.onclick = () => {
				t.getMessageSpan().html(labels.loading).show();
				toggleRevisionSignificant(post_id, revision_id, function (data) {
					t.getMessageSpan().html(labels.saved).fadeOut(1000);
					var response = jQuery.parseJSON(data);
					t.updateRevisionSignificant(response.significant);
				});
			};

			this.$el.find('.mark-significant').remove();
			this.$el.append(button);

			// Add feedback message Span
			var message = document.createElement('span');
			message.className = 'mark-significant-message';
			message.style = 'margin-left:10px';
			this.$el.append(message);

		};

		/**
		 * Ajax call to toggle revision significance
		 */
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
