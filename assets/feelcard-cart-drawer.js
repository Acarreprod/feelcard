/**
 * FEELCARD Cart Drawer - JavaScript isolé
 * Namespace complet pour éviter les conflits
 */

// Namespace principal isolé
window.FEELCARD = window.FEELCARD || {}

window.FEELCARD.CartDrawer = (() => {
  // Variables privées isolées
  let isOpen = false
  let isLoading = false
  let currentCart = null
  let focusTrap = null
  let touchStartX = 0
  let touchStartY = 0

  // Sélecteurs préfixés
  const SELECTORS = {
    overlay: ".feelcard-cart-overlay",
    backdrop: ".feelcard-backdrop",
    container: ".feelcard-drawer-container",
    closeBtn: ".feelcard-close-btn",
    qtyBtn: ".feelcard-qty-btn",
    qtyInput: ".feelcard-qty-input",
    removeBtn: ".feelcard-remove-btn",
    noteToggle: ".feelcard-note-toggle",
    noteModal: ".feelcard-note-modal",
    noteTextarea: ".feelcard-note-textarea",
    noteSave: ".feelcard-note-save",
    noteCancel: ".feelcard-note-cancel",
    checkoutForm: ".feelcard-checkout-form",
    loadingOverlay: ".feelcard-loading-overlay",
    carouselPrev: ".feelcard-carousel-prev",
    carouselNext: ".feelcard-carousel-next",
    carouselTrack: ".feelcard-carousel-track",
    recAddBtn: ".feelcard-recommendation-card .feelcard-btn",
  }

  // Éléments DOM cachés
  let elements = {}

  /**
   * Initialisation isolée
   */
  function init() {
    cacheElements()
    bindEvents()
    setupAccessibility()
    setupTouchGestures()

    // Écouter les événements Shopify isolés
    document.addEventListener("cart:updated", handleCartUpdate)
    document.addEventListener("product:added-to-cart", handleProductAdded)

    console.log("FEELCARD Cart Drawer initialized")
  }

  /**
   * Cache des éléments DOM avec préfixes
   */
  function cacheElements() {
    elements = {
      overlay: document.querySelector(SELECTORS.overlay),
      backdrop: document.querySelector(SELECTORS.backdrop),
      container: document.querySelector(SELECTORS.container),
      loadingOverlay: document.querySelector(SELECTORS.loadingOverlay),
    }

    if (!elements.overlay) {
      console.error("FEELCARD Cart Drawer: Overlay element not found")
      return
    }
  }

  /**
   * Liaison des événements isolés
   */
  function bindEvents() {
    if (!elements.overlay) return

    // Fermeture
    elements.overlay.addEventListener("click", handleBackdropClick)
    document.addEventListener("keydown", handleKeydown)

    // Boutons de fermeture
    elements.overlay.addEventListener("click", (e) => {
      if (e.target.closest(SELECTORS.closeBtn)) {
        close()
      }
    })

    // Contrôles de quantité
    elements.overlay.addEventListener("click", handleQuantityClick)
    elements.overlay.addEventListener("change", handleQuantityChange)

    // Suppression de produits
    elements.overlay.addEventListener("click", handleRemoveClick)

    // Note de commande
    elements.overlay.addEventListener("click", handleNoteToggle)

    // Formulaire de checkout
    elements.overlay.addEventListener("submit", handleCheckoutSubmit)

    // Carousel recommandations
    elements.overlay.addEventListener("click", handleCarouselClick)

    // Ajout recommandations
    elements.overlay.addEventListener("click", handleRecommendationAdd)

    // Triggers externes (boutons panier du site)
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-feelcard-cart-trigger]")
      if (trigger) {
        e.preventDefault()
        open()
      }
    })
  }

  /**
   * Configuration de l'accessibilité isolée
   */
  function setupAccessibility() {
    if (!elements.overlay) return

    // Focus trap
    const focusableElements = elements.overlay.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )

    focusTrap = {
      firstElement: focusableElements[0],
      lastElement: focusableElements[focusableElements.length - 1],
    }
  }

  /**
   * Configuration des gestes tactiles isolés
   */
  function setupTouchGestures() {
    if (!elements.container) return

    elements.container.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.touches[0].clientX
        touchStartY = e.touches[0].clientY
      },
      { passive: true },
    )

    elements.container.addEventListener(
      "touchend",
      (e) => {
        if (!touchStartX || !touchStartY) return

        const touchEndX = e.changedTouches[0].clientX
        const touchEndY = e.changedTouches[0].clientY

        const diffX = touchStartX - touchEndX
        const diffY = touchStartY - touchEndY

        // Swipe vers la droite pour fermer (> 100px)
        if (Math.abs(diffX) > Math.abs(diffY) && diffX < -100) {
          close()
        }

        touchStartX = 0
        touchStartY = 0
      },
      { passive: true },
    )
  }

  /**
   * Ouverture de la drawer isolée
   */
  function open() {
    if (isOpen || !elements.overlay) return

    isOpen = true
    elements.overlay.setAttribute("data-state", "open")
    elements.overlay.setAttribute("aria-hidden", "false")

    // Focus management isolé
    setTimeout(() => {
      const firstFocusable = elements.overlay.querySelector("button, [href], input")
      if (firstFocusable) {
        firstFocusable.focus()
      }
    }, 300)

    // Prévenir le scroll du body (isolé)
    document.body.style.overflow = "hidden"

    // Animation d'entrée
    requestAnimationFrame(() => {
      elements.overlay.style.opacity = "1"
      elements.overlay.style.visibility = "visible"
    })

    // Événement personnalisé isolé
    dispatchEvent("feelcard:cart:opened")
  }

  /**
   * Fermeture de la drawer isolée
   */
  function close() {
    if (!isOpen || !elements.overlay) return

    isOpen = false
    elements.overlay.setAttribute("data-state", "closed")
    elements.overlay.setAttribute("aria-hidden", "true")

    // Restaurer le scroll du body
    document.body.style.overflow = ""

    // Animation de sortie
    elements.overlay.style.opacity = "0"
    setTimeout(() => {
      elements.overlay.style.visibility = "hidden"
    }, 300)

    // Fermer la modal de note si ouverte
    const noteModal = elements.overlay.querySelector(SELECTORS.noteModal)
    if (noteModal) {
      noteModal.setAttribute("data-state", "closed")
    }

    // Événement personnalisé isolé
    dispatchEvent("feelcard:cart:closed")
  }

  /**
   * Gestion du clic sur le backdrop
   */
  function handleBackdropClick(e) {
    if (e.target === elements.backdrop) {
      close()
    }
  }

  /**
   * Gestion des touches clavier isolée
   */
  function handleKeydown(e) {
    if (!isOpen) return

    switch (e.key) {
      case "Escape":
        close()
        break
      case "Tab":
        handleTabNavigation(e)
        break
    }
  }

  /**
   * Navigation Tab isolée (focus trap)
   */
  function handleTabNavigation(e) {
    if (!focusTrap) return

    if (e.shiftKey) {
      if (document.activeElement === focusTrap.firstElement) {
        e.preventDefault()
        focusTrap.lastElement.focus()
      }
    } else {
      if (document.activeElement === focusTrap.lastElement) {
        e.preventDefault()
        focusTrap.firstElement.focus()
      }
    }
  }

  /**
   * Gestion des clics sur les contrôles de quantité
   */
  function handleQuantityClick(e) {
    const qtyBtn = e.target.closest(SELECTORS.qtyBtn)
    if (!qtyBtn) return

    e.preventDefault()

    const action = qtyBtn.getAttribute("data-action")
    const lineIndex = qtyBtn.getAttribute("data-line")
    const input = elements.overlay.querySelector(`${SELECTORS.qtyInput}[data-line="${lineIndex}"]`)

    if (!input) return

    const currentQty = Number.parseInt(input.value) || 0
    let newQty = currentQty

    if (action === "increase") {
      newQty = currentQty + 1
    } else if (action === "decrease") {
      newQty = Math.max(0, currentQty - 1)
    }

    if (newQty !== currentQty) {
      input.value = newQty
      updateLineItem(lineIndex, newQty)
    }
  }

  /**
   * Gestion du changement de quantité direct
   */
  function handleQuantityChange(e) {
    const input = e.target.closest(SELECTORS.qtyInput)
    if (!input) return

    const lineIndex = input.getAttribute("data-line")
    const newQty = Math.max(0, Number.parseInt(input.value) || 0)

    input.value = newQty
    updateLineItem(lineIndex, newQty)
  }

  /**
   * Gestion de la suppression de produits
   */
  function handleRemoveClick(e) {
    const removeBtn = e.target.closest(SELECTORS.removeBtn)
    if (!removeBtn) return

    e.preventDefault()

    const lineIndex = removeBtn.getAttribute("data-line")

    // Animation de suppression
    const lineItem = removeBtn.closest(".feelcard-line-item")
    if (lineItem) {
      lineItem.style.transform = "translateX(100%)"
      lineItem.style.opacity = "0"

      setTimeout(() => {
        updateLineItem(lineIndex, 0)
      }, 300)
    }
  }

  /**
   * Mise à jour d'un line item via API Shopify
   */
  function updateLineItem(lineIndex, quantity) {
    if (isLoading) return

    showLoading()

    const formData = new FormData()
    formData.append("line", lineIndex)
    formData.append("quantity", quantity)

    fetch("/cart/change.js", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((cart) => {
        currentCart = cart
        refreshCartContent()
        updateCartCount(cart.item_count)
        dispatchEvent("feelcard:cart:updated", { cart })
      })
      .catch((error) => {
        console.error("FEELCARD Cart Update Error:", error)
        showError("Erreur lors de la mise à jour du panier")
      })
      .finally(() => {
        hideLoading()
      })
  }

  /**
   * Gestion de la note de commande
   */
  function handleNoteToggle(e) {
    const noteToggle = e.target.closest(SELECTORS.noteToggle)
    if (!noteToggle) return

    e.preventDefault()

    const noteModal = elements.overlay.querySelector(SELECTORS.noteModal)
    if (!noteModal) return

    noteModal.setAttribute("data-state", "open")

    // Focus sur le textarea
    const textarea = noteModal.querySelector(SELECTORS.noteTextarea)
    if (textarea) {
      setTimeout(() => textarea.focus(), 100)
    }

    // Gestion des boutons de la modal
    const saveBtn = noteModal.querySelector(SELECTORS.noteSave)
    const cancelBtn = noteModal.querySelector(SELECTORS.noteCancel)

    if (saveBtn) {
      saveBtn.onclick = () => saveNote(noteModal, textarea)
    }

    if (cancelBtn) {
      cancelBtn.onclick = () => noteModal.setAttribute("data-state", "closed")
    }
  }

  /**
   * Sauvegarde de la note de commande
   */
  function saveNote(modal, textarea) {
    if (!textarea) return

    showLoading()

    const formData = new FormData()
    formData.append("note", textarea.value)

    fetch("/cart/update.js", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((cart) => {
        currentCart = cart
        modal.setAttribute("data-state", "closed")
        dispatchEvent("feelcard:cart:note-updated", { note: cart.note })
      })
      .catch((error) => {
        console.error("FEELCARD Note Update Error:", error)
        showError("Erreur lors de la sauvegarde de la note")
      })
      .finally(() => {
        hideLoading()
      })
  }

  /**
   * Gestion du formulaire de checkout
   */
  function handleCheckoutSubmit(e) {
    const form = e.target.closest(SELECTORS.checkoutForm)
    if (!form) return

    const submitBtn = form.querySelector('button[type="submit"]')
    if (submitBtn) {
      submitBtn.classList.add("loading")
    }

    // Laisser le formulaire se soumettre normalement
    dispatchEvent("feelcard:cart:checkout-started")
  }

  /**
   * Gestion du carousel de recommandations
   */
  function handleCarouselClick(e) {
    const prevBtn = e.target.closest(SELECTORS.carouselPrev)
    const nextBtn = e.target.closest(SELECTORS.carouselNext)

    if (!prevBtn && !nextBtn) return

    e.preventDefault()

    const track = elements.overlay.querySelector(SELECTORS.carouselTrack)
    if (!track) return

    const cardWidth = 220 // 200px + 20px gap
    const currentTransform = getTransformX(track)

    if (prevBtn) {
      const newTransform = Math.min(0, currentTransform + cardWidth)
      track.style.transform = `translateX(${newTransform}px)`
    } else if (nextBtn) {
      const maxScroll = -(track.scrollWidth - track.parentElement.offsetWidth)
      const newTransform = Math.max(maxScroll, currentTransform - cardWidth)
      track.style.transform = `translateX(${newTransform}px)`
    }
  }

  /**
   * Ajout de produits recommandés
   */
  function handleRecommendationAdd(e) {
    const addBtn = e.target.closest(SELECTORS.recAddBtn)
    if (!addBtn) return

    e.preventDefault()

    const productId = addBtn.getAttribute("data-product-id")
    const variantId = addBtn.getAttribute("data-variant-id")

    if (!variantId) return

    addBtn.classList.add("loading")
    addBtn.disabled = true

    const formData = new FormData()
    formData.append("id", variantId)
    formData.append("quantity", 1)

    fetch("/cart/add.js", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((item) => {
        // Masquer la carte de recommandation
        const card = addBtn.closest(".feelcard-recommendation-card")
        if (card) {
          card.style.opacity = "0"
          card.style.transform = "scale(0.8)"
          setTimeout(() => card.remove(), 300)
        }

        // Rafraîchir le panier
        return fetch("/cart.js")
      })
      .then((response) => response.json())
      .then((cart) => {
        currentCart = cart
        refreshCartContent()
        updateCartCount(cart.item_count)
        dispatchEvent("feelcard:cart:item-added", { cart })
      })
      .catch((error) => {
        console.error("FEELCARD Add Recommendation Error:", error)
        showError("Erreur lors de l'ajout du produit")
        addBtn.classList.remove("loading")
        addBtn.disabled = false
      })
  }

  /**
   * Gestion des événements Shopify
   */
  function handleCartUpdate(e) {
    if (e.detail && e.detail.cart) {
      currentCart = e.detail.cart
      refreshCartContent()
      updateCartCount(e.detail.cart.item_count)
    }
  }

  function handleProductAdded(e) {
    // Auto-ouverture après ajout produit
    setTimeout(() => {
      open()
    }, 100)
  }

  /**
   * Rafraîchissement du contenu du panier
   */
  function refreshCartContent() {
    if (!elements.overlay) return

    // Recharger la section via Shopify Section Rendering API
    fetch(`${window.location.pathname}?section_id=feelcard-cart-drawer`)
      .then((response) => response.text())
      .then((html) => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, "text/html")
        const newContent = doc.querySelector(".feelcard-cart-overlay")

        if (newContent && elements.overlay) {
          elements.overlay.innerHTML = newContent.innerHTML
          setupAccessibility()
        }
      })
      .catch((error) => {
        console.error("FEELCARD Refresh Error:", error)
      })
  }

  /**
   * Mise à jour du compteur de panier externe
   */
  function updateCartCount(count) {
    const counters = document.querySelectorAll("[data-feelcard-cart-count]")
    counters.forEach((counter) => {
      counter.textContent = count
      counter.setAttribute("data-count", count)

      // Animation bounce
      counter.style.animation = "none"
      requestAnimationFrame(() => {
        counter.style.animation = "feelcard-bounce 0.5s ease-out"
      })
    })
  }

  /**
   * Affichage du loading
   */
  function showLoading() {
    isLoading = true
    if (elements.loadingOverlay) {
      elements.loadingOverlay.setAttribute("data-state", "visible")
    }
  }

  /**
   * Masquage du loading
   */
  function hideLoading() {
    isLoading = false
    if (elements.loadingOverlay) {
      elements.loadingOverlay.setAttribute("data-state", "hidden")
    }
  }

  /**
   * Affichage d'erreur
   */
  function showError(message) {
    // Créer une notification toast isolée
    const toast = document.createElement("div")
    toast.className = "feelcard-toast feelcard-toast--error"
    toast.innerHTML = `
      <div class="feelcard-toast-content">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <span>${message}</span>
      </div>
    `

    document.body.appendChild(toast)

    // Animation d'entrée
    requestAnimationFrame(() => {
      toast.style.opacity = "1"
      toast.style.transform = "translateY(0)"
    })

    // Auto-suppression
    setTimeout(() => {
      toast.style.opacity = "0"
      toast.style.transform = "translateY(-100%)"
      setTimeout(() => toast.remove(), 300)
    }, 3000)
  }

  /**
   * Utilitaire pour obtenir la valeur translateX
   */
  function getTransformX(element) {
    const style = window.getComputedStyle(element)
    const matrix = style.transform

    if (matrix === "none") return 0

    const values = matrix.split("(")[1].split(")")[0].split(",")
    return Number.parseInt(values[4]) || 0
  }

  /**
   * Dispatch d'événements personnalisés isolés
   */
  function dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail: detail,
      bubbles: true,
      cancelable: true,
    })

    document.dispatchEvent(event)
  }

  /**
   * API publique isolée
   */
  return {
    init: init,
    open: open,
    close: close,
    isOpen: () => isOpen,
    getCurrentCart: () => currentCart,
    refresh: refreshCartContent,
  }
})()

// Auto-initialisation isolée
document.addEventListener("DOMContentLoaded", () => {
  window.FEELCARD.CartDrawer.init()
})

// CSS pour les toasts (ajouté dynamiquement)
const toastStyles = `
.feelcard-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000002;
  background: var(--feelcard-white);
  border-radius: var(--feelcard-radius-medium);
  box-shadow: var(--feelcard-shadow-overlay);
  padding: 1rem;
  opacity: 0;
  transform: translateY(-100%);
  transition: all var(--feelcard-transition-medium);
  max-width: 300px;
}

.feelcard-toast--error {
  border-left: 4px solid #ef4444;
}

.feelcard-toast-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: var(--feelcard-black);
}

.feelcard-toast-content svg {
  width: 20px;
  height: 20px;
  stroke: #ef4444;
  stroke-width: 2;
  flex-shrink: 0;
}
`

// Injection des styles toast
const styleSheet = document.createElement("style")
styleSheet.textContent = toastStyles
document.head.appendChild(styleSheet)
