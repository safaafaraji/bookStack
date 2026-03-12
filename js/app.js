// URLs des données
const BOOKS_API = 'data/books.json';
const REVIEWS_API = 'data/reviews.json';

let allBooks = [];

// ─── Utilitaire : génère les étoiles HTML ───────────────────────────────────
function renderStars(rating) {
    const full  = Math.round(rating);
    const empty = 5 - full;
    return `<span class="star-rating">` +
           `<span class="stars-full">${'★'.repeat(full)}</span>` +
           `<span class="stars-empty">${'★'.repeat(empty)}</span>` +
           `</span>`;
}

// ─── PAGE INDEX : CATALOGUE ──────────────────────────────────────────────────

async function loadBooks() {
    try {
        const response = await fetch(BOOKS_API);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allBooks = await response.json();
        displayBooks(allBooks);
        setupFilters();
    } catch (error) {
        console.error("Erreur de chargement :", error);
        showError('book-list', 'Impossible de charger les livres. Vous devez utiliser un serveur web (Ex: Live Server) pour exécuter des requêtes asynchrones fetch() en local.');
    }
}

function displayBooks(books) {
    const bookList = document.getElementById('book-list');
    if (!bookList) return;

    bookList.innerHTML = '';

    if (books.length === 0) {
        bookList.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-search text-muted display-1 mb-3"></i>
                <p class="fs-4 text-muted">Aucun livre trouvé correspondant à votre recherche.</p>
                <button class="btn btn-outline-primary" onclick="resetFilters()">Réinitialiser les filtres</button>
            </div>
        `;
        return;
    }

    books.forEach(book => {
        const col = document.createElement('div');
        col.className = 'col-lg-3 col-md-4 col-sm-6 mb-4';

        col.innerHTML = `
            <article class="card book-card h-100 shadow-sm border-0">
                <div class="position-relative">
                    <img src="${book.image}" class="card-img-top" alt="Couverture de ${book.title}" loading="lazy">
                    <span class="badge position-absolute top-0 end-0 m-3 bg-primary">${book.category || 'Général'}</span>
                </div>
                <div class="card-body d-flex flex-column text-center">
                    <h5 class="card-title fw-bold text-dark mt-2">${book.title}</h5>
                    <h6 class="card-subtitle mb-3 text-primary fw-semibold">${book.author}</h6>

                    <div class="mb-4 mt-auto">
                        <div class="d-flex justify-content-center align-items-center bg-light p-2 rounded-pill gap-2">
                            ${renderStars(book.rating)}
                            <span class="fw-bold text-dark">${book.rating}</span>
                        </div>
                    </div>

                    <button class="btn btn-primary w-100 detail-btn fw-bold py-2 shadow-sm" data-id="${book.id}">
                        Détails <i class="bi bi-arrow-right-short ms-1"></i>
                    </button>
                </div>
            </article>
        `;

        bookList.appendChild(col);
    });

    document.querySelectorAll('.detail-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            window.location.href = `book.html?id=${id}`;
        });
    });
}

function setupFilters() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => filterBooks());
    }

    const categoryLinks = document.querySelectorAll('.category-filter');
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = e.target.getAttribute('data-category');
            const dropdownBtn = document.querySelector('.dropdown-toggle');
            dropdownBtn.innerText = category === 'all' ? 'Filtrer par catégorie' : `Catégorie: ${category}`;
            filterBooks(category);
        });
    });
}

function filterBooks(currentCategory = null) {
    const query = (document.getElementById('search-input')?.value || '').toLowerCase();

    let category = currentCategory;
    if (!category) {
        const dropdownBtnText = document.querySelector('.dropdown-toggle')?.innerText || '';
        category = dropdownBtnText.includes(': ') ? dropdownBtnText.split(': ')[1] : 'all';
    }

    const filtered = allBooks.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(query) ||
            book.author.toLowerCase().includes(query);
        const matchesCategory = category === 'all' || book.category === category;
        return matchesSearch && matchesCategory;
    });

    displayBooks(filtered);
}

function resetFilters() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    const dropdownBtn = document.querySelector('.dropdown-toggle');
    if (dropdownBtn) dropdownBtn.innerText = 'Filtrer par catégorie';
    displayBooks(allBooks);
}


// ─── PAGE BOOK : DÉTAILS ─────────────────────────────────────────────────────

async function loadBook() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        showError('book-details', "Aucun identifiant de livre fourni dans l'URL.");
        return;
    }

    try {
        const booksResponse = await fetch(BOOKS_API);
        if (!booksResponse.ok) throw new Error("Erreur de récupération des livres");
        const books = await booksResponse.json();

        const book = books.find(b => b.id == id);
        if (!book) {
            showError('book-details', "Livre introuvable dans le catalogue.");
            return;
        }

        displayBookDetails(book);
        await loadReviews(id);
        setupReviewForm(id);

    } catch (error) {
        console.error("Erreur détaillée :", error);
        showError('book-details', "Impossible de charger les détails de ce livre.");
    }
}

function displayBookDetails(book) {
    document.title = `${book.title} - Détails | BookStack`;

    const detailsContainer = document.getElementById('book-details');
    if (!detailsContainer) return;

    detailsContainer.innerHTML = `
        <div class="row align-items-center g-5">
            <div class="col-lg-5 text-center">
                <img src="${book.image}" alt="Couverture de ${book.title}" class="img-fluid book-detail-img">
            </div>
            <div class="col-lg-7">
                <nav aria-label="breadcrumb" class="mb-3">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item"><a href="index.html" class="text-decoration-none">Catalogue</a></li>
                        <li class="breadcrumb-item active">${book.category || 'Général'}</li>
                        <li class="breadcrumb-item active" aria-current="page">${book.title}</li>
                    </ol>
                </nav>

                <h1 class="display-4 fw-bold text-dark mb-2">${book.title}</h1>
                <h4 class="text-secondary d-block mb-4">Écrit par <span class="text-primary fw-bold">${book.author}</span></h4>

                <div class="d-inline-flex align-items-center mb-4 p-3 glass-card shadow-sm gap-3">
                    ${renderStars(book.rating)}
                    <span class="fs-5 fw-bold text-dark">${book.rating} / 5</span>
                    <span class="badge bg-success px-3 py-2 rounded-pill"><i class="bi bi-patch-check-fill me-1"></i>En Stock</span>
                </div>

                <div class="mt-4">
                    <h5 class="fw-bold mb-3 text-uppercase small tracking-widest text-secondary border-bottom pb-2">Résumé de l'œuvre</h5>
                    <p class="lead text-secondary" style="line-height: 1.8; font-size: 1.1rem;">
                        ${book.description}
                    </p>
                </div>

                <div class="mt-5 d-flex gap-3">
                    <a href="index.html" class="btn btn-primary px-4 py-2 fw-bold text-uppercase shadow-sm">
                        <i class="bi bi-arrow-left me-2"></i>Retour au catalogue
                    </a>
                    <button class="btn btn-outline-dark px-4 py-2 fw-bold text-uppercase shadow-sm">
                        <i class="bi bi-heart me-2"></i>Favoris
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function loadReviews(bookId) {
    try {
        const response = await fetch(REVIEWS_API);
        if (!response.ok) throw new Error("Impossible de charger les avis");
        const reviews = await response.json();

        const bookReviews = reviews.filter(r => r.bookId == bookId);
        const reviewsContainer = document.getElementById('reviews-list');
        if (!reviewsContainer) return;

        reviewsContainer.innerHTML = '';

        if (bookReviews.length === 0) {
            reviewsContainer.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-chat-dots-fill text-muted mb-3 opacity-25" style="font-size: 4rem;"></i>
                    <p class="text-secondary fs-5">Aucun avis pour le moment.</p>
                    <p class="text-muted small">Soyez le premier à donner votre avis sur cet ouvrage !</p>
                </div>
            `;
            return;
        }

        bookReviews.forEach(review => appendReviewToDOM(review));

    } catch (error) {
        console.error('Erreur avis :', error);
        document.getElementById('reviews-list').innerHTML = `
            <div class="alert alert-danger"><i class="bi bi-exclamation-triangle"></i> Impossible de charger les commentaires.</div>
        `;
    }
}

function appendReviewToDOM(review) {
    const list = document.getElementById('reviews-list');

    // Supprimer le message "aucun avis" si présent
    if (list.querySelector('.text-center.py-5')) {
        list.innerHTML = '';
    }

    const div = document.createElement('div');
    div.className = 'review-item';

    div.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <strong class="text-dark fs-5">
                    <i class="bi bi-person-circle text-primary me-2"></i>${review.user}
                </strong>
                <span class="text-muted small ms-2">Il y a un instant</span>
            </div>
            ${renderStars(review.rating)}
        </div>
        <p class="mb-0 text-secondary mt-2 fst-italic">"${review.comment}"</p>
    `;

    list.prepend(div);
}

function setupReviewForm(bookId) {
    const form = document.getElementById('add-review-form');
    if (!form) return;

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const user    = document.getElementById('userName').value.trim();
        const rating  = document.getElementById('userRating').value;
        const comment = document.getElementById('userComment').value.trim();

        if (!user || !rating || !comment) return;

        const newReview = {
            bookId: parseInt(bookId),
            user:   user,
            rating: parseInt(rating),
            comment: comment
        };

        appendReviewToDOM(newReview);
        form.reset();

        const toastContainer = document.getElementById('form-feedback');
        if (toastContainer) {
            toastContainer.innerHTML = `
                <div class="alert alert-success alert-dismissible fade show mt-3 shadow-sm rounded-4" role="alert">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-check-circle-fill me-3 fs-3"></i>
                        <div>
                            <strong>Succès !</strong> Votre avis a été publié avec succès.<br>
                            Merci ${user} d'avoir partagé votre expérience avec la communauté BookStack.
                        </div>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
            setTimeout(() => {
                const alertEl = toastContainer.querySelector('.alert');
                if (alertEl) {
                    const alert = bootstrap.Alert.getOrCreateInstance(alertEl);
                    if (alert) alert.close();
                }
            }, 5000);
        }
    });
}

function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="alert alert-danger shadow-lg border-danger border-start border-5 rounded-4 mt-4" role="alert">
                <div class="d-flex">
                    <i class="bi bi-exclamation-triangle-fill text-danger me-3 fs-2"></i>
                    <div>
                        <h4 class="alert-heading fw-bold">Oups ! Une erreur est survenue</h4>
                        <p class="mb-0">${message}</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// ─── Init ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('book-list')) {
        loadBooks();
    } else if (document.getElementById('book-details')) {
        loadBook();
    }
});