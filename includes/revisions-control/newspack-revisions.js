(function ($) {
	if (typeof wp.revisions.view.MetaTo != 'undefined') {
		var TickMarks = wp.revisions.view.Tickmarks, old_ready = TickMarks.prototype.ready;

		TickMarks.prototype.ready = function () {

			old_ready.apply(this);

			// update Tickmarks
			const tickmarks = $('.revisions-tickmarks > div');

			for (var i = 0; i < tickmarks.length; i++) {
				// Add the ID to the element so we can manipulate it later.
				$(tickmarks[i]).attr('id', 'tickmark-' + this.model.revisions.models[i].attributes.id)
				if (this.model.revisions.models[i].attributes.newspack_major) {
					$(tickmarks[i]).addClass('newspack_major');
				}
			}

		}

		var MetaTo = wp.revisions.view.MetaTo,
			old_render = MetaTo.prototype.render;

		/**
		 * Callback after ajax request
		 */
		MetaTo.prototype.updateRevisionMajor = function (major) {
			this.model.attributes.to.attributes.newspack_major = major;
			this.updateToggleMajorButton();
			var tick = $('#tickmark-' + this.model.attributes.to.attributes.id);
			if (major) {
				tick.addClass('newspack_major');
			} else {
				tick.removeClass('newspack_major');
			}
		}

		/**
		 * Handles the creation of the button to toggle revivision
		 */
		MetaTo.prototype.updateToggleMajorButton = function () {
			var labels = newspack_revisions_control.labels;

			var button = this.$el.find('.mark-major');
			button.prop('value', this.model.attributes.to.attributes.newspack_major ? labels.unmark : labels.mark);

		}

		/**
		 * Gets the Message element
		 */
		MetaTo.prototype.getMessageSpan = function () {
			return this.$el.find('.mark-major-message');
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
			button.value = this.model.attributes.to.attributes.newspack_major ? labels.unmark : labels.mark;
			button.className = 'mark-major button button-secondary';

			var t = this;
			var revision_id = this.model.attributes.to.attributes.id;
			var post_id = this.model.attributes.postId;

			button.onclick = () => {
				t.getMessageSpan().html(labels.loading).show();
				toggleRevisionMajor(post_id, revision_id, function (data) {
					t.getMessageSpan().html(labels.saved).fadeOut(1000);
					var response = jQuery.parseJSON(data);
					t.updateRevisionMajor(response.major);
				});
			};

			this.$el.find('.mark-major').remove();
			this.$el.append(button);

			// Add feedback message Span
			var message = document.createElement('span');
			message.className = 'mark-major-message';
			message.style = 'margin-left:10px';
			this.$el.append(message);

		};

		/**
		 * Ajax call to toggle revision
		 */
		function toggleRevisionMajor(post_id, id, callback) {
			$.post(
				newspack_revisions_control.ajax_url,
				{
					action: 'newspack_toggle_revision_major',
					revision_id: id,
					post_id: post_id,
					_ajax_nonce: newspack_revisions_control.mark_major_nonce,
				},
				callback
			);
		}
	}
})(jQuery);
