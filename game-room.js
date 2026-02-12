const BGG_USER = '0xACE';

function parsePlaysXML(xml) {
	const plays = [];
	xml.querySelectorAll('play').forEach(function(play) {
		let players = [];
		play.querySelectorAll('player').forEach(function(player) {
			let name = player.getAttribute('name');
			if (name !== 'Anonymous player') {
				players.push(name.split(' ')[0]);
			}
		});

		let comments = '';
		if (play.querySelector('comments')) {
			comments = play.querySelector('comments').textContent;
		}

		const p_json = {
			'bgg_id': play.querySelector('item').getAttribute('objectid'),
			'name': play.querySelector('item').getAttribute('name'),
			'date': play.getAttribute('date'),
			'players': players.join(', '),
			'comments': comments,
			'location': play.getAttribute('location')
		};
		plays.push(p_json);
	});

	return plays;
}

function parseGamesXML(xml) {
	const games = [];
	xml.querySelectorAll('item').forEach(function(game) {
		let comments = '';
		if (game.querySelector('comments')) {
			comments = game.querySelector('comments').textContent;
		}

		const p_game = {
			'bgg_id': game.getAttribute('objectid'),
			'name': game.querySelector('name').textContent,
			'image': game.querySelector('image').textContent,
			'year': game.querySelector('yearpublished').textContent,
			'plays': game.querySelector('numplays').textContent,
			'comments': comments
		};

		games.push(p_game);
	});

	return games;
}

function bgg_uri(game) {
	return "https://boardgamegeek.com/boardgame/" + game.bgg_id;
}

// Lazy image loader using IntersectionObserver: when an image element
// with `data-bgg-id` becomes visible, fetch its thumbnail and set `src`.
let _bggImageObserver = null;

function loadImageElement(img) {
	const MAX_RETRIES = 3;

	const id = img.getAttribute('data-bgg-id');
	if (!id || img.getAttribute('data-bgg-loaded')) {
		// avoid double-loading
		return;
	}

	if (!window.token) {
		// try again shortly if token isn't ready yet
		setTimeout(() => loadImageElement(img), 200);
		return;
	}

	$.ajax({
			url: "https://boardgamegeek.com/xmlapi2/thing?id=" + id,
			headers: { 'Authorization': `Bearer ${window.token}` },
			dataType: 'xml'})
		.done(function(xml) {
			const node = xml.querySelector('thumbnail');
			if (node) {
				const src = node.textContent;
				img.setAttribute('src', src);
				img.setAttribute('data-bgg-loaded', '1');
			}})
		.fail(function(err) {
			// retry logic with exponential backoff
			const prev = parseInt(img.getAttribute('data-bgg-retries') || '0', 10);
			if (prev < MAX_RETRIES) {
				const next = prev + 1;
				img.setAttribute('data-bgg-retries', String(next));
				const delay = 500 * Math.pow(2, prev); // 500ms, 1000ms, 2000ms
				setTimeout(function() { loadImageElement(img); }, delay);
			} else {
				// final failure; leave placeholder
				img.setAttribute('data-bgg-failed', '1');
				console.log("failed to load image");
				console.log(err);
				// setTimeout(function() { loadImageElement(img); }, 500);
			}
		}
	);
}

function startObservingImages() {
	const imgs = document.querySelectorAll('img.game-image[data-bgg-id]');
	if (!imgs || imgs.length === 0) return;

	if ('IntersectionObserver' in window) {
		if (!_bggImageObserver) {
			_bggImageObserver = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						startObservingImages.called = true;
						const img = entry.target;
						// _bggImageObserver.unobserve(img);
						loadImageElement(img);
					}
				});
			}, { root: null, rootMargin: '200px', threshold: 0.1 });
		}

		imgs.forEach((img) => {
			// only observe elements that haven't been loaded yet
			if (!img.getAttribute('data-bgg-loaded')) {
				_bggImageObserver.observe(img);
			}
		});

	} else {
		// No IntersectionObserver: load visible images immediately
		imgs.forEach((img) => {
			loadImageElement(img);
		});
	}
}

function bgg_image(game) {
	const img_id = 'img_' + game.bgg_id;
	if (game.bgg_id > 0) {
		// Render placeholder image element and attach data attribute used by
		// the IntersectionObserver to kick off fetching when visible.
		return '<img class="game-image ' + img_id 
			+ '" data-bgg-id="' + game.bgg_id 
			+ '" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" />';
	}

	return '<img class="game-image ' + img_id + '" />';
}

function render_date(the_date) {
	const d = new Date(the_date + "T00:00:00");
	return '<span style="white-space: nowrap;">' + the_date + '</span> '
		+ d.toLocaleDateString('en-US', { weekday: 'long' });
}

function addLocalGames() {
	$.ajax({
		url: 'games.xml',
	}).done(function(xml) {
		var game_list = $('#game-list').DataTable();
		const games = parseGamesXML(xml);
		game_list.rows.add(games).draw();
	}).fail(function(err) {
		console.log(err);
	});
}

function addLocalPlays() {
	$.ajax({
		url: 'plays.xml',
	}).done(function(xml) {
		var play_list = $('#play-list').DataTable();
		const games = parsePlaysXML(xml);
		play_list.rows.add(games).draw();
	}).fail(function(err) {
		console.log(err);
	});
}

$(document).ready(function() {
	(async function() {
		try {
			const wasm = await import('./wasm/dist/token_wasm.js');
			await wasm.default();
			window.token = wasm.get_token();
		} catch (e) {
			console.error('WASM token load failed, using fallback', e);
		}

		initTables();
	})();

	function initTables() {
		$('#play-list').DataTable({
		responsive: true,
		ajax: {
			// url: 'bgg-plays.xml',
			url: `https://boardgamegeek.com/xmlapi2/plays\?username\=${BGG_USER}`,
			headers: { 'Authorization': `Bearer ${window.token}` },
			dataType: "text",
			dataSrc: function(response) {
				addLocalPlays();
				const xml = (new window.DOMParser()).parseFromString(response, "text/xml");
				return parsePlaysXML(xml);
			}
		},
		paging: false,
		order: [[0, "desc"]],
		columns: [
			{ "data": "date" },
			{ "data": null, "defaultContent": "", "orderable": false },
			{ "data": "name", width: "25%"  },
			{ "data": "players", "defaultContent": "" },
			{ "data": "location", "defaultContent": "" },
			{ "data": "comments", "defaultContent": "" }
		],
		columnDefs: [
			{
				targets: 0,
				responsivePriority: 1,
				render: function(data, type, row) {
					return render_date(data);
				}
			},
			{
				targets: 1,
				responsivePriority: 2,
				render: function(data, type, row) {
					return "<a href='" + bgg_uri(row) + "' target='_blank'>"
						+ bgg_image(row) + "</a>";
				}
			},
			{
				targets: 2,
				responsivePriority: 2,
				render: function(data, type, row) {
					return "<a href='" + bgg_uri(row) + "' target='_blank'>" + data + "</a>";
				}
			}
		]
		});

		// Observe images after initial draw and on table redraws
		startObservingImages();
		$('#play-list').on('draw.dt', function() { startObservingImages(); });

		$('#game-list').DataTable({
		responsive: true,
		ajax: {
			// url: 'bgg-collection.xml',
			url: `https://boardgamegeek.com/xmlapi2/collection\?username\=${BGG_USER}`,
			headers: { 'Authorization': `Bearer ${window.token}` },
			dataType: "text",
			dataSrc: function(response) {
				addLocalGames();
				const xml = (new window.DOMParser()).parseFromString(response, "text/xml");
				return parseGamesXML(xml);
			}
		},
		paging: false,
		order: [[1, "asc"]],
		columns: [
			{ "data": "image", "defaultContent": "", "orderable": false},
			{ "data": "name", width: "25%" },
			{ "data": "year", "defaultContent": "" },
			{ "data": "plays", "defaultContent": "0" },
			{ "data": "comments", "defaultContent": "" }
		],
		columnDefs: [
			{
				targets: 0,
				render: function(data, type, row) {
					return "<a href='" + bgg_uri(row) + "' target='_blank'>"
						+ bgg_image(row) + "</a>";

				}
			},
			{
				targets: 1,
				render: function(data, type, row) {
					return "<a href='" + bgg_uri(row) + "' target='_blank'>" + data + "</a>";
				}
			}
		]
		});
		$('#game-list').on('draw.dt', function() { startObservingImages(); });

		// Collapse navbar on mobile
		var navMain = $(".navbar-collapse");
		navMain.on("click", "a:not([data-toggle])", null, function () {
			navMain.collapse('hide');
		});
	}
});