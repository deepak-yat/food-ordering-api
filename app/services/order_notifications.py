from app.models.order import OrderStatus


STATUS_INFO = {
    OrderStatus.ACCEPTED: {
        "notify": True,
        "title": "Order Confirmed",
        "message": "Your order from {shop_name} has been confirmed.",
    },

    OrderStatus.PREPARING: {
        "notify": True,
        "title": "Order Being Prepared",
        "message": "Your order from {shop_name} is now being prepared.",
    },

    OrderStatus.READY: {
        "notify": True,
        "title": "Order Ready",
        "message": "Your order from {shop_name} is ready for pickup/delivery.",
    },

    OrderStatus.COMPLETED: {
        "notify": True,
        "title": "Order Delivered",
        "message": "Your order from {shop_name} has been delivered successfully.",
    },

    OrderStatus.REJECTED: {
        "notify": True,
        "title": "Order Cancelled",
        "message": "Your order from {shop_name} has been cancelled.",
    },

    OrderStatus.CANCELLED: {
        "notify": True,
        "title": "Order Cancelled",
        "message": "Your order from {shop_name} has been cancelled.",
    },
}