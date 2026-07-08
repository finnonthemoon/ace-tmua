/* we will use this as an object for each user. For the moment
we will pull from localStorage but when we launch we 
will need to have a backend server to manage user data */

class UserData {
  #STORAGE_KEY;
  #DEFAULT_USER;
  constructor() {
    this.#STORAGE_KEY = "userData";

    this.#DEFAULT_USER = {
      userID: "localUser",
      name: "Tony Prescott",
      targetUni: "Manchester",
      targetScore: 85,
      avatarUrl: null,
      streak: 4,
    };
  }
  get() {
    const raw = localStorage.getItem(this.#STORAGE_KEY);
    if (!raw) {
      this.set(this.#DEFAULT_USER);
      return this.#DEFAULT_USER;
    }
    return JSON.parse(raw);
  }

  set(data) {
    localStorage.setItem(this.#STORAGE_KEY, JSON.stringify(data));
    return data;
  }
  update(partialData) {
    const currentData = this.get();
    const updatedData = { ...currentData, ...partialData };
    this.set(updatedData);
    return updatedData;
  }
}

const userData = new UserData();

async function loadSeedData() {
  const res = await fetch("local-storage-seed.json");
  const seed = await res.json();

  Object.entries(seed).forEach(([key, value]) => {
    localStorage.setItem(key, JSON.stringify(value));
  });

  console.log("Seed data loaded into localStorage:", Object.keys(seed));
  location.reload();
}
