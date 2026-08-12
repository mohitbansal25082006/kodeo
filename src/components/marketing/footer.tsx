import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const FOOTER_LINKS = {
  Product: ["Overview", "Workflow", "Pricing", "Changelog"],
  Developers: ["Documentation", "API", "Status", "GitHub"],
  Company: ["About", "Blog", "Careers", "Contact"],
};

export function Footer() {
  return (
    <footer className="relative border-t border-border py-14 lg:py-16">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-secondary">
              The collaborative cloud IDE for developers who move from first
              line to final deploy.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <div className="text-xs font-bold uppercase tracking-wider text-tertiary">
                {section}
              </div>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-secondary transition-colors hover:text-primary"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-tertiary">
            © 2026 KODEO SYSTEMS. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="#"
              className="text-xs text-tertiary transition-colors hover:text-secondary"
            >
              Privacy
            </Link>
            <div className="flex items-center gap-1.5 text-xs text-tertiary">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              System status
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}