import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createOrder, getOrder, getPublishedEvent } from "@/lib/api";
import { OrderStatus, PublishedEventDetails, TicketTypeDetails } from "@/domain/domain";
import { CheckCircle, CreditCard, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate, useParams } from "react-router";

// Dynamically load the Razorpay checkout script
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PurchaseTicketPage: React.FC = () => {
  const { eventId, ticketTypeId } = useParams();
  const { isLoading: isAuthLoading, user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<PublishedEventDetails | undefined>();
  const [ticketType, setTicketType] = useState<TicketTypeDetails | undefined>();
  const [quantity, setQuantity] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [error, setError] = useState<string | undefined>();
  const [isPurchaseSuccess, setIsPurchaseSuccess] = useState(false);

  // Fetch Event and Ticket Type details
  useEffect(() => {
    if (!eventId || !ticketTypeId) return;
    getPublishedEvent(eventId)
      .then((data: PublishedEventDetails) => {
        setEvent(data);
        const type = data.ticketTypes.find((t: TicketTypeDetails) => t.id === ticketTypeId);
        setTicketType(type);
      })
      .catch((err: any) => {
        console.error("Failed to load event details", err);
        setError("Failed to load event details. Please try again.");
      });
  }, [eventId, ticketTypeId]);

  // Handle redirect after successful purchase
  useEffect(() => {
    if (!isPurchaseSuccess) {
      return;
    }
    const timer = setTimeout(() => {
      navigate("/tickets");
    }, 3000);

    return () => clearTimeout(timer);
  }, [isPurchaseSuccess, navigate]);

  const pollOrderStatus = async (orderId: string) => {
    if (!user?.access_token) return;
    
    setStatusMessage("Verifying payment status...");
    let attempts = 0;
    const maxAttempts = 15; // Poll for ~30 seconds

    const interval = setInterval(async () => {
      attempts++;
      try {
        const order = await getOrder(user.access_token!, orderId);
        
        if (order.status === OrderStatus.PAID) {
          clearInterval(interval);
          setIsPurchaseSuccess(true);
          setIsProcessing(false);
        } else if (order.status === OrderStatus.FAILED || order.status === OrderStatus.EXPIRED) {
          clearInterval(interval);
          setError(`Payment failed with status: ${order.status}`);
          setIsProcessing(false);
        }
      } catch (err) {
        console.error("Error polling order status", err);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setError("Verification is taking longer than expected. Please check your Tickets page in a moment.");
        setIsProcessing(false);
      }
    }, 2000);
  };

  const handlePurchase = async () => {
    if (isAuthLoading || !user?.access_token || !ticketTypeId) {
      return;
    }

    setIsProcessing(true);
    setStatusMessage("Initializing secure checkout...");
    setError(undefined);

    try {
      // 1. Ensure Razorpay script is loaded
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error("Failed to load payment gateway library. Please check your internet connection.");
      }

      // 2. Generate idempotency key
      const idempotencyKey = `idemp-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;

      // 3. Create the order in the backend
      const order = await createOrder(user.access_token, ticketTypeId, quantity, idempotencyKey);

      // 4. Open Razorpay Checkout modal
      const options = {
        key: order.razorpayKeyId,
        amount: order.totalAmount * 100, // Amount is in currency subunits (paise)
        currency: "INR",
        name: "Ticketra",
        description: `Order for ${event?.name || 'Event Ticket'}`,
        image: "https://img.icons8.com/color/120/000000/ticket.png",
        order_id: order.razorpayOrderId,
        prefill: {
          name: user.profile.name || "Attendee User",
          email: user.profile.email || "attendee@example.com",
        },
        theme: {
          color: "#818cf8",
        },
        handler: function () {
          pollOrderStatus(order.id);
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      setIsProcessing(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred during order creation.");
      }
    }
  };

  if (isPurchaseSuccess) {
    return (
      <div className="bg-black min-h-screen text-white flex items-center">
        <div className="max-w-md mx-auto p-8 text-center">
          <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm text-black">
            <div className="space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto animate-bounce" />
              <h2 className="text-2xl font-bold text-green-600">Booking Confirmed!</h2>
              <p className="text-gray-600">
                Your ticket purchase was successful.
              </p>
              <p className="text-gray-400 text-sm">
                Redirecting to your tickets page in a few seconds...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white flex items-center relative">
      {/* Loading Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 text-indigo-400 animate-spin" />
          <p className="text-lg font-medium text-indigo-200">{statusMessage}</p>
        </div>
      )}

      <div className="max-w-md mx-auto py-10 w-full px-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-32 height-32 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
          
          <div className="space-y-2">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Secure Checkout</span>
            <h1 className="text-2xl font-bold tracking-tight">Confirm Purchase</h1>
            {event && <p className="text-neutral-400 text-sm">{event.name} &bull; {event.venue}</p>}
          </div>

          {error && (
            <div className="border border-red-900/50 rounded-xl p-4 bg-red-950/20 text-red-400 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          {ticketType && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-neutral-100">{ticketType.name}</h3>
                  <p className="text-xs text-neutral-500">{ticketType.description}</p>
                </div>
                <span className="font-bold text-indigo-400">₹{ticketType.price}</span>
              </div>

              <div className="border-t border-neutral-800 pt-3 flex justify-between items-center">
                <Label htmlFor="quantity-select" className="text-neutral-400 text-sm">Quantity</Label>
                <select
                  id="quantity-select"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-neutral-200 focus:outline-none focus:border-indigo-500 text-sm"
                >
                  {[1, 2, 3, 4, 5].map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              <div className="border-t border-neutral-800 pt-3 flex justify-between items-center font-semibold text-lg">
                <span className="text-neutral-300">Total Price</span>
                <span className="text-white">₹{ticketType.price * quantity}</span>
              </div>
            </div>
          )}

          <Button
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-6 rounded-xl transition duration-200 cursor-pointer shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2"
            onClick={handlePurchase}
            disabled={isProcessing || !ticketType}
          >
            <CreditCard className="h-5 w-5" />
            Pay Now
          </Button>

          <div className="text-neutral-500 text-xs text-center">
            Transactions are encrypted. By clicking Pay Now, you agree to our terms.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseTicketPage;
