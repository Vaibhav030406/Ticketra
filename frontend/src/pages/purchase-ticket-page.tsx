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
      navigate("/dashboard/tickets");
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
          color: "#f59e0b",
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
      <div className="bg-zinc-950 min-h-screen text-zinc-100 flex items-center justify-center relative overflow-hidden">
        {/* Ambient glow orbs */}
        <div className="absolute top-20 right-1/4 w-72 h-72 bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-20 left-1/4 w-56 h-56 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-md mx-auto w-full px-4">
          <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-10 text-center relative overflow-hidden">
            {/* Emerald accent glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-5 relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 mx-auto">
                <CheckCircle className="h-10 w-10 text-emerald-400 animate-bounce" />
              </div>
              <h2 className="text-2xl font-bold text-emerald-400 tracking-tight">
                Booking Confirmed!
              </h2>
              <p className="text-zinc-400 text-sm">
                Your ticket purchase was successful.
              </p>
              <p className="text-zinc-500 text-xs">
                Redirecting to your tickets page in a few seconds...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 min-h-screen text-zinc-100 flex items-center justify-center relative overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="absolute -top-10 right-1/4 w-80 h-80 bg-amber-500/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-56 h-56 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 w-12 h-12 bg-amber-500/20 rounded-full blur-xl" />
            <Loader2 className="h-12 w-12 text-amber-400 animate-spin relative z-10" />
          </div>
          <p className="text-lg font-medium text-amber-200">{statusMessage}</p>
        </div>
      )}

      <div className="max-w-md mx-auto py-10 w-full px-4 relative z-10">
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-6 relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-2 relative z-10">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
              Secure Checkout
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Confirm Purchase
            </h1>
            {event && (
              <p className="text-zinc-400 text-sm">
                {event.name} &bull; {event.venue}
              </p>
            )}
          </div>

          {error && (
            <div className="backdrop-blur-sm border border-red-500/20 rounded-xl p-4 bg-red-500/[0.06] text-red-400 text-sm relative z-10">
              <strong>Error:</strong> {error}
            </div>
          )}

          {ticketType && (
            <div className="bg-zinc-900/50 border border-white/[0.06] rounded-xl p-4 space-y-4 relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-zinc-100">{ticketType.name}</h3>
                  <p className="text-xs text-zinc-500">{ticketType.description}</p>
                </div>
                <span className="font-bold text-amber-400">₹{ticketType.price}</span>
              </div>

              <div className="border-t border-white/[0.06] pt-3 flex justify-between items-center">
                <Label htmlFor="quantity-select" className="text-zinc-400 text-sm">
                  Quantity
                </Label>
                <select
                  id="quantity-select"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="bg-zinc-900 border border-white/[0.08] rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-amber-500/50 text-sm transition-all duration-200"
                >
                  {[1, 2, 3, 4, 5].map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              <div className="border-t border-white/[0.06] pt-3 flex justify-between items-center font-semibold text-lg">
                <span className="text-zinc-300">Total Price</span>
                <span className="text-amber-400 text-xl">₹{ticketType.price * quantity}</span>
              </div>
            </div>
          )}

          <Button
            className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold py-6 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 relative z-10"
            onClick={handlePurchase}
            disabled={isProcessing || !ticketType}
          >
            <CreditCard className="h-5 w-5" />
            Pay Now
          </Button>

          <div className="text-zinc-500 text-xs text-center relative z-10">
            Transactions are encrypted. By clicking Pay Now, you agree to our terms.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseTicketPage;
