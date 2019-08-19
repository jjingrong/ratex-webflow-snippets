class ShippingTracker {
  constructor() {
    // Constants
    this.steppersDom = {
      processing: {
        inactive: '#item-processing-inactive',
        active: '#item-processing-active',
      },
      shipped: {
        inactive: '#item-shipped-inactive',
        active: '#item-shipped-active',
      },
      reachedWarehouse: {
        inactive: '#item-reached-warehouse-inactive',
        active: '#item-reached-warehouse-active',
      },
      delivering: {
        inactive: '#item-delivering-inactive',
        active: '#item-delivering-active',
      },
      delivered: {
        inactive: '#item-delivered-inactive',
        active: '#item-delivered-active',
      },
      cancelled: {
        active: '#item-cancelled-active',
        inactive: '',
      },
      returned: {
        active: '#item-returned-active',
        inactive: '',
      }
    }
    this.statusStringMapper = {
      1: "Sedang Diproses", // "Processing",  || OrderItemStatusPendingGoodsOrder
      2: "Sedang Diproses", // "Processing",  || OrderItemStatusPendingFirstMile
      3: "Sedang Diproses", // "Processing",  || OrderItemStatusFirstMile
      4: "Sedang Diproses", // "Processing",  || OrderItemStatusOverseasWarehouseReceived
      5: "Dikirim", // "Shipped" || OrderItemStatusFreightForwarding
      6: "Pesanan tiba di gudang", // "Reached warehouse",  || OrderItemStatusLocalWarehouseReceived
      7: "Pesanan dikirim", // "Delivering",  || OrderItemStatusDelivering
      8: "Pesanan selesai", // "Delivered",  || OrderItemStatusDelivered
      9: "Dibatalkan", // "Cancelled", , || OrderItemStatusCancelled
      10: "Pesanan selesai", // "Delivered",  || OrderItemStatusPartiallyReturned
      11: "Pesanan selesai"// "Delivered" || OrderItemStatusReturned
    }
    // this.searchParams = new URLSearchParams(window.location.search);
    this.itemId = this.getUrlParameter('i');
    this.debugMode = this.getUrlParameter('debug');
    this.url = `https://ratesapp.co.id/rs/api/tracking?i=${this.itemId}`; // prod
    // this.url = `https://staging.ratesapp.co.id/rs/api/tracking?i=${this.itemId}`; // staging
    // do api call
    this.fetchData();
  }
  // Phase 1: Processing
  toggleItemProcessingActive = () => {
    $(this.steppersDom.processing.inactive).css('display', 'none');
    $(this.steppersDom.processing.active).css('display', 'flex');
  }
  // Phase 2: Item Shipped
  toggleItemShippedActive = () => {
    $(this.steppersDom.shipped.inactive).css('display', 'none');
    $(this.steppersDom.shipped.active).css('display', 'flex');
  }
  // Phase 3: Item Reached Warehouse
  toggleItemReachedWarehouseActive = () => {
    $(this.steppersDom.reachedWarehouse.inactive).css('display', 'none');
    $(this.steppersDom.reachedWarehouse.active).css('display', 'flex');
  }
  // Phase 4: Item Delivering (We may have external tracking info here)
  toggleItemDeliveringActive = () => {
    $(this.steppersDom.delivering.inactive).css('display', 'none');
    $(this.steppersDom.delivering.active).css('display', 'flex');
  }
  // Phase 5: Item Delivered
  toggleItemDeliveredActive = () => {
    $(this.steppersDom.delivered.inactive).css('display', 'none');
    $(this.steppersDom.delivered.active).css('display', 'flex');
  }

  /* Additional Phases */
  // Cancelled
  handleItemCancelledEvent = () => {
    // Hide everything
    Object.keys(this.steppersDom).forEach((key) => {
      $(this.steppersDom[key].active).css('display', 'none');
      $(this.steppersDom[key].inactive).css('display', 'none');
    })
    // Show item cancelled stepper
    $(this.steppersDom.cancelled.active).css('display', 'flex');
  }
  // Returned
  toggleItemIsReturned = () => {
    $(this.steppersDom.returned.active).css('display', 'flex');
  }

  // Status Box Modifier
  updateStatusBox = (status) => {
    const statusString = this.statusStringMapper[status];
    $('#item-status').html(statusString)
    $('#item-ID').html(this.itemId)
    $('#item-duration').html('Terima dalam 10-13 hari')
  }
  updateShippingInfo = (courier, trackingRef, url) => {
    $('#courier').html(courier);
    $('#Courier-url').html(url);
    $('#Courier-url').attr("href", url);
    $('#Tracking-ID').html(trackingRef);
  }

  fetchData = () => {
    // Do api call
    $.ajax({
      url: this.url,
      // data: { signature: authHeader },
      type: "GET",
      beforeSend: function (xhr) { xhr.setRequestHeader('Accept-Language', 'id-ID'); },
      success: (response) => {
        // Grab values
        const {
          status,
          courier,
          trackingRef,
          url
        } = response.data
        // Update status box
        this.updateStatusBox(status);
        // Update tracking info if available
        if (trackingRef && (trackingRef.length > 0) && url && (url.length > 0)) {
          this.updateShippingInfo(courier, trackingRef, url);
        }
        // Do status toggling logic. Basically the larger numbers will switch all of the prior ones on
        switch (status) {
          // Special case: Cancelled. Only 1 that will break. We will remove all the steppers
          case 9:
            this.handleItemCancelledEvent();
            break;
          case 11:
          case 10:
            this.toggleItemIsReturned();
          case 8:
            this.toggleItemDeliveredActive();
          case 7:
            this.toggleItemDeliveringActive();
          case 6:
          case 5:
          case 4:
            this.toggleItemReachedWarehouseActive();
          case 3:
            this.toggleItemShippedActive();
          case 2:
          case 1:
            this.toggleItemProcessingActive();
        }
      },
      error: (error) => {
        // We swallow the errors, and display not found error
        $('.tracking-main-body').css('display', 'none') // hide tracking stuff
        $('#error-message').css('display', 'flex'); // show error div
        if (this.debugMode) {
          if (error.responseJSON) {
            alert(error.responseJSON.message);
          } else {
            alert(error.responseText)
          }
        }
      }
    });
  }
  // Helpers. GetUrlParameters is not supported in some non-modern browsers
  getUrlParameter = (name) => {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  }
}

// Class runner
new ShippingTracker();