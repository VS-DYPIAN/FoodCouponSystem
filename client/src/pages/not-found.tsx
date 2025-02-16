import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaCheckCircle } from "react-icons/fa";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const amount = searchParams.get("amount");
  const transactionId = searchParams.get("transactionId");
  const vendor = searchParams.get("vendor");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="max-w-md w-full shadow-lg text-center p-6 bg-white rounded-lg">
        <CardHeader>
          <FaCheckCircle className="text-green-500 text-6xl mx-auto animate-pulse" />
          <CardTitle className="text-2xl mt-4 font-bold">Payment Successful</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">Your payment of <span className="font-bold">₹{amount}</span> was successful.</p>
          <div className="text-left text-sm text-gray-500 bg-gray-50 p-4 rounded-md">
            <p><strong>Transaction ID:</strong> {transactionId}</p>
            <p><strong>Paid To:</strong> {vendor}</p>
          </div>
          <Button onClick={() => navigate("/dashboard")} className="w-full mt-4">
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
