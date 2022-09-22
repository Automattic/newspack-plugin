(function ($) {
	if (typeof wp.revisions.view.MetaTo != 'undefined') {
		var MetaTo = wp.revisions.view.MetaTo,
			old_render = MetaTo.prototype.render;

		MetaTo.prototype.updateRevisionRelevance = function (relevant) {
			this.model.attributes.to.attributes.newspack_relevant = relevant;
			this.updateRelevanceButton();
		}
		MetaTo.prototype.updateRelevanceButton = function () {
			var button = document.createElement('input');
			button.type = 'button';
			console.log('asd');
			console.log(this.model.attributes.to.attributes.newspack_relevant);
			button.value = this.model.attributes.to.attributes.newspack_relevant ? 'Unmark as relevant' : 'Mark as relevant';
			var t = this;
			var revision_id = this.model.attributes.to.attributes.id;
			var post_id = this.model.attributes.postId;
			button.onclick = () => {
				toggleRevisionRelevant(post_id, revision_id, function (data) {
					var response = jQuery.parseJSON(data);
					t.updateRevisionRelevance(response.relevant);
				});
			};
			button.className = 'mark-relevant button button-secondary';
			this.$el.find('.mark-relevant').remove();
			this.$el.append(button);
		}
		MetaTo.prototype.render = function () {
			// Have the original renderer run first.
			old_render.apply(this, arguments);

			console.log(this.model);
			this.updateRelevanceButton(); //$el.append( getButton() );

		};

		function toggleRevisionRelevant(post_id, id, callback) {
			$.post(
				newspack_revisions_control.ajax_url,
				{
					action: 'newspack_toggle_revision_relevant',
					revision_id: id,
					post_id: post_id
				},
				callback
			);
		}
	}
})(jQuery);
