"use client";

import { useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";

export default function PasswordStrength({ password }: { password: string }) {
  const bonusRef = useRef<HTMLLIElement>(null);

  const strength = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    extra: password.length >= 12,
  };

  const coreChecks = [strength.length, strength.uppercase, strength.number, strength.special];
  const fulfilled = coreChecks.filter(Boolean).length;

  // Bar colour logic
  let barColor = "bg-red-500";
  if (strength.extra) barColor = "bg-yellow-400";
  else if (fulfilled === 4) barColor = "bg-green-500";

  const widthPercent = (fulfilled / 4) * 100;

  // Fire confetti from bonus text
  useEffect(() => {
    if (strength.extra && bonusRef.current) {
      const rect = bonusRef.current.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { x, y },
        colors: ["#FFD700", "#FFC700", "#FFB700"], // gold
      });
    }
  }, [strength.extra]);

  return (
    <div className="mt-2">
      {/* Progress bar */}
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${widthPercent}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="text-gray-400 mt-2">
        <ul className="space-y-1 text-sm">
          <li className="flex items-center gap-2">
            {strength.length ? <Check size={16} className="text-green-500" /> : <X size={16} className="text-red-500" />}
            At least 8 characters
          </li>
          <li className="flex items-center gap-2">
            {strength.uppercase ? <Check size={16} className="text-green-500" /> : <X size={16} className="text-red-500" />}
            Contains uppercase letter
          </li>
          <li className="flex items-center gap-2">
            {strength.number ? <Check size={16} className="text-green-500" /> : <X size={16} className="text-red-500" />}
            Contains a number
          </li>
          <li className="flex items-center gap-2">
            {strength.special ? <Check size={16} className="text-green-500" /> : <X size={16} className="text-red-500" />}
            Contains a special character
          </li>

          {/* Bonus text */}
          <AnimatePresence>
            {fulfilled === 4 && password.length > 0 && (
              <motion.li
                key="bonus"
                ref={bonusRef}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2"
              >
                {strength.extra ? <Check size={16} className="text-yellow-400" /> : <X size={16} className="text-gray-300" />}
                <span className={strength.extra ? "text-yellow-600 font-medium" : ""}>
                  More than 12 characters (bonus)
                </span>
              </motion.li>
            )}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}