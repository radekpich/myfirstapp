import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EventFlow — Event Management for Professionals",
  description:
    "All-in-one platform for weddings, teambuildings and corporate events.",
};

export default function Home() {
  return (
    <main
      className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden"
      style={{ fontFamily: "'Georgia', serif" }}
    >
      {/* Background texture */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-[#c9a84c] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#c9a84c]" />
          </div>
          <span
            className="text-xl tracking-[0.2em] text-[#c9a84c] uppercase"
            style={{ fontFamily: "Georgia, serif", letterSpacing: "0.25em" }}
          >
            EventFlow
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/50 tracking-widest uppercase">
          <a
            href="#features"
            className="hover:text-[#c9a84c] transition-colors"
          >
            Features
          </a>
          <a href="#pricing" className="hover:text-[#c9a84c] transition-colors">
            Pricing
          </a>
          <a href="#contact" className="hover:text-[#c9a84c] transition-colors">
            Contact
          </a>
        </div>
        <a
          href="#contact"
          className="px-6 py-2 border border-[#c9a84c] text-[#c9a84c] text-sm tracking-widest uppercase hover:bg-[#c9a84c] hover:text-black transition-all duration-300"
        >
          Get Access
        </a>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-8 pt-32 pb-40 text-center max-w-5xl mx-auto">
        <p className="text-[#c9a84c] text-xs tracking-[0.4em] uppercase mb-8">
          Professional Event Management
        </p>
        <h1
          className="text-5xl md:text-7xl font-light leading-tight mb-8"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Every great event
          <br />
          <span className="italic text-[#c9a84c]">begins with a plan.</span>
        </h1>
        <p
          className="text-white/40 text-lg max-w-xl mx-auto mb-12 leading-relaxed"
          style={{ fontFamily: "system-ui, sans-serif", fontWeight: 300 }}
        >
          Quotes, bookings, tasks and team coordination — all in one elegant
          dashboard designed for event professionals.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#contact"
            className="px-10 py-4 bg-[#c9a84c] text-black text-sm tracking-widest uppercase hover:bg-[#e0c070] transition-all duration-300 font-medium"
          >
            Start Free Trial
          </a>
          <a
            href="#features"
            className="px-10 py-4 border border-white/20 text-white/70 text-sm tracking-widest uppercase hover:border-white/50 hover:text-white transition-all duration-300"
          >
            See Features
          </a>
        </div>

        {/* Decorative line */}
        <div className="mt-24 flex items-center gap-4">
          <div className="flex-1 h-px bg-white/10" />
          <div className="w-2 h-2 border border-[#c9a84c] rotate-45" />
          <div className="flex-1 h-px bg-white/10" />
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 border-y border-white/5 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-0">
          {[
            { number: "500+", label: "Events Managed" },
            { number: "98%", label: "Client Satisfaction" },
            { number: "3×", label: "Faster Quoting" },
            { number: "0 CZK", label: "To Get Started" },
          ].map((stat, i) => (
            <div
              key={i}
              className="text-center px-8 py-6 border-r border-white/5 last:border-0"
            >
              <div
                className="text-3xl text-[#c9a84c] mb-2"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {stat.number}
              </div>
              <div
                className="text-white/30 text-xs tracking-widest uppercase"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="relative z-10 px-8 py-32 max-w-6xl mx-auto"
      >
        <div className="text-center mb-20">
          <p className="text-[#c9a84c] text-xs tracking-[0.4em] uppercase mb-4">
            Everything You Need
          </p>
          <h2
            className="text-4xl md:text-5xl font-light"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Built for event <span className="italic">professionals</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-white/5">
          {[
            {
              icon: "◈",
              title: "Smart Quote Calculator",
              desc: "Build detailed quotes in minutes. Guests, venue, catering, extras — instant totals with PDF export for clients.",
            },
            {
              icon: "◉",
              title: "Booking Calendar",
              desc: "See all your events at a glance. Track deposits, balances, and client details in one organized view.",
            },
            {
              icon: "◎",
              title: "Task Management",
              desc: "Checklists for every event. Assign tasks to your team, set deadlines, and never miss a detail.",
            },
            {
              icon: "◐",
              title: "Client Portal",
              desc: "Share event details and quotes directly with clients. Professional and branded to your business.",
            },
            {
              icon: "◑",
              title: "Team Collaboration",
              desc: "Invite staff, assign roles, and coordinate your whole team from one dashboard.",
            },
            {
              icon: "◒",
              title: "Analytics & Reports",
              desc: "Track revenue, popular services, and business growth with beautiful, clear reports.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-[#0f0f0f] p-8 hover:bg-[#141414] transition-colors group"
            >
              <div className="text-[#c9a84c] text-2xl mb-4 group-hover:scale-110 transition-transform inline-block">
                {feature.icon}
              </div>
              <h3
                className="text-lg mb-3 font-light"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {feature.title}
              </h3>
              <p
                className="text-white/30 text-sm leading-relaxed"
                style={{ fontFamily: "system-ui, sans-serif", fontWeight: 300 }}
              >
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Event types */}
      <section className="relative z-10 px-8 py-20 bg-[#0d0d0d]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#c9a84c] text-xs tracking-[0.4em] uppercase mb-4">
            Perfect For
          </p>
          <h2
            className="text-3xl font-light mb-16"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Every type of <span className="italic">special event</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              "Weddings",
              "Teambuildings",
              "Corporate Events",
              "Birthday Parties",
              "Galas",
              "Conferences",
              "Private Dinners",
              "Outdoor Festivals",
            ].map((type, i) => (
              <span
                key={i}
                className="px-6 py-2 border border-white/10 text-white/50 text-sm tracking-wider hover:border-[#c9a84c] hover:text-[#c9a84c] transition-all cursor-default"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="relative z-10 px-8 py-32 max-w-4xl mx-auto"
      >
        <div className="text-center mb-20">
          <p className="text-[#c9a84c] text-xs tracking-[0.4em] uppercase mb-4">
            Simple Pricing
          </p>
          <h2
            className="text-4xl font-light"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Start free, grow <span className="italic">without limits</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-px bg-white/5">
          <div className="bg-[#0f0f0f] p-10">
            <p
              className="text-white/30 text-xs tracking-widest uppercase mb-4"
              style={{ fontFamily: "system-ui" }}
            >
              Starter
            </p>
            <div
              className="text-4xl text-white mb-1"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Free
            </div>
            <p
              className="text-white/20 text-sm mb-8"
              style={{ fontFamily: "system-ui" }}
            >
              Forever, no credit card
            </p>
            <ul
              className="space-y-3 text-sm text-white/40"
              style={{ fontFamily: "system-ui", fontWeight: 300 }}
            >
              {[
                "Up to 5 events/month",
                "Quote calculator",
                "Basic task lists",
                "Email support",
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-[#c9a84c]">—</span> {f}
                </li>
              ))}
            </ul>
            <a
              href="#contact"
              className="mt-8 block text-center py-3 border border-white/20 text-white/50 text-sm tracking-widest uppercase hover:border-white/50 hover:text-white transition-all"
              style={{ fontFamily: "system-ui" }}
            >
              Get Started
            </a>
          </div>

          <div className="bg-[#0f0f0f] p-10 relative">
            <div
              className="absolute top-4 right-4 px-3 py-1 bg-[#c9a84c] text-black text-xs tracking-widest uppercase"
              style={{ fontFamily: "system-ui" }}
            >
              Popular
            </div>
            <p
              className="text-[#c9a84c] text-xs tracking-widest uppercase mb-4"
              style={{ fontFamily: "system-ui" }}
            >
              Professional
            </p>
            <div
              className="text-4xl text-white mb-1"
              style={{ fontFamily: "Georgia, serif" }}
            >
              990 <span className="text-xl text-white/30">CZK</span>
            </div>
            <p
              className="text-white/20 text-sm mb-8"
              style={{ fontFamily: "system-ui" }}
            >
              per month
            </p>
            <ul
              className="space-y-3 text-sm text-white/40"
              style={{ fontFamily: "system-ui", fontWeight: 300 }}
            >
              {[
                "Unlimited events",
                "Full quote system + PDF",
                "Team collaboration",
                "Client portal",
                "Analytics & reports",
                "Priority support",
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-[#c9a84c]">—</span> {f}
                </li>
              ))}
            </ul>
            <a
              href="#contact"
              className="mt-8 block text-center py-3 bg-[#c9a84c] text-black text-sm tracking-widest uppercase hover:bg-[#e0c070] transition-all font-medium"
              style={{ fontFamily: "system-ui" }}
            >
              Start Free Trial
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="contact"
        className="relative z-10 px-8 py-32 text-center border-t border-white/5"
      >
        <div className="max-w-xl mx-auto">
          <div className="w-12 h-px bg-[#c9a84c] mx-auto mb-8" />
          <h2
            className="text-4xl font-light mb-6"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Ready to transform
            <br />
            <span className="italic text-[#c9a84c]">your events business?</span>
          </h2>
          <p
            className="text-white/30 mb-10 text-sm leading-relaxed"
            style={{ fontFamily: "system-ui", fontWeight: 300 }}
          >
            Join event professionals who manage their weddings, teambuildings
            and corporate events with EventFlow.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-5 py-3 bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#c9a84c] transition-colors"
              style={{ fontFamily: "system-ui" }}
            />
            <button
              type="submit"
              className="px-8 py-3 bg-[#c9a84c] text-black text-sm tracking-widest uppercase hover:bg-[#e0c070] transition-all font-medium whitespace-nowrap"
              style={{ fontFamily: "system-ui" }}
            >
              Get Access
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <span
          className="text-[#c9a84c] text-sm tracking-widest uppercase"
          style={{ fontFamily: "Georgia, serif" }}
        >
          EventFlow
        </span>
        <p
          className="text-white/20 text-xs tracking-wider"
          style={{ fontFamily: "system-ui" }}
        >
          Built for event professionals · © 2025
        </p>
        <div
          className="flex gap-6 text-white/20 text-xs tracking-widest uppercase"
          style={{ fontFamily: "system-ui" }}
        >
          <a href="#" className="hover:text-white/50 transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-white/50 transition-colors">
            Terms
          </a>
        </div>
      </footer>
    </main>
  );
}
